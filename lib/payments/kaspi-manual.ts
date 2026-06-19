import "server-only";
import { query, one, withTransaction } from "@/lib/db";
import { notifyOperator } from "@/lib/notify";
import type {
  PaymentProvider,
  PaymentMode,
  CreateChargeInput,
  CreateChargeResult,
  ReleasePayoutInput,
} from "./types";

// ============================================================
// KaspiManual — день-0 режим.
// createCharge  → Payment(pending) + Kaspi QR-ссылка, пинг оператору.
// confirmPayment→ оператор видит поступление в Kaspi Pay и подтверждает.
// releasePayout → выплата раз в неделю.
// Состояния в БД те же, что и в auto — меняется только триггер.
// ============================================================

export class KaspiManual implements PaymentProvider {
  readonly mode: PaymentMode = "manual";

  async createCharge({ bookingId, amount }: CreateChargeInput): Promise<CreateChargeResult> {
    const payUrl = `https://kaspi.kz/pay?service=Agrigator&amount=${amount}&comment=BOOKING-${bookingId}`;

    const row = await one<{ id: string }>(
      `insert into "Payment" ("bookingId", amount, status, provider, "payUrl")
       values ($1, $2, 'pending', 'kaspi_manual', $3)
       on conflict ("bookingId") do update
         set amount = excluded.amount, "payUrl" = excluded."payUrl", provider = 'kaspi_manual'
       returning id`,
      [bookingId, amount, payUrl],
    );

    await notifyOperator({ type: "payment_pending", bookingId, amount });
    return { payUrl, paymentId: row!.id };
  }

  async confirmPayment(bookingId: string): Promise<void> {
    const payment = await one<{ status: string }>(
      `select status from "Payment" where "bookingId" = $1`,
      [bookingId],
    );
    if (!payment) throw new Error("Платёж не найден");
    if (payment.status === "confirmed" || payment.status === "released") return; // идемпотентность

    await withTransaction(async (c) => {
      await c.query(
        `update "Payment" set status = 'confirmed', "confirmedAt" = now() where "bookingId" = $1`,
        [bookingId],
      );
      await c.query(`update "Booking" set status = 'paid' where id = $1`, [bookingId]);
    });
  }

  async releasePayout({ tutorId, paymentId }: ReleasePayoutInput): Promise<{ released: number }> {
    const rows = await query<{ id: string; bookingId: string }>(
      `select p.id, p."bookingId"
       from "Payment" p join "Booking" b on b.id = p."bookingId"
       where p.status = 'confirmed' and b."tutorId" = $1 and b.status in ('paid','completed')
       ${paymentId ? `and p.id = $2` : ``}`,
      paymentId ? [tutorId, paymentId] : [tutorId],
    );

    for (const r of rows) {
      await withTransaction(async (c) => {
        await c.query(
          `update "Payment" set status = 'released', "releasedAt" = now() where id = $1`,
          [r.id],
        );
        await c.query(`update "Booking" set status = 'settled' where id = $1`, [r.bookingId]);
      });
    }
    return { released: rows.length };
  }
}
