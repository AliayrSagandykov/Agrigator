import "server-only";
import { prisma } from "@/lib/db";
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
// createCharge  → создаёт Payment(pending) + Kaspi QR-ссылку, пингует оператора.
// confirmPayment→ оператор видит поступление в Kaspi Pay и подтверждает в /admin.
// releasePayout → оператор выплачивает раз в неделю.
// Состояния в БД те же, что и в auto — меняется только триггер.
// ============================================================

export class KaspiManual implements PaymentProvider {
  readonly mode: PaymentMode = "manual";

  async createCharge({ bookingId, amount }: CreateChargeInput): Promise<CreateChargeResult> {
    // Эскроу = счёт оператора держит деньги до урока. Код брони — в комментарии платежа.
    const payUrl = `https://kaspi.kz/pay?service=Agrigator&amount=${amount}&comment=BOOKING-${bookingId}`;

    const payment = await prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        amount,
        status: "pending",
        provider: "kaspi_manual",
        payUrl,
      },
      update: { amount, payUrl, provider: "kaspi_manual" },
    });

    await notifyOperator({ type: "payment_pending", bookingId, amount });
    return { payUrl, paymentId: payment.id };
  }

  async confirmPayment(bookingId: string): Promise<void> {
    const payment = await prisma.payment.findUnique({ where: { bookingId } });
    if (!payment) throw new Error("Платёж не найден");
    if (payment.status === "confirmed" || payment.status === "released") return; // идемпотентность

    await prisma.$transaction([
      prisma.payment.update({
        where: { bookingId },
        data: { status: "confirmed", confirmedAt: new Date() },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: "paid" },
      }),
    ]);
  }

  async releasePayout({ tutorId, paymentId }: ReleasePayoutInput): Promise<{ released: number }> {
    const payments = await prisma.payment.findMany({
      where: {
        status: "confirmed",
        ...(paymentId ? { id: paymentId } : {}),
        booking: { tutorId, status: { in: ["paid", "completed"] } },
      },
      include: { booking: true },
    });

    for (const p of payments) {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: p.id },
          data: { status: "released", releasedAt: new Date() },
        }),
        prisma.booking.update({
          where: { id: p.bookingId },
          data: { status: "settled" },
        }),
      ]);
    }
    return { released: payments.length };
  }
}
