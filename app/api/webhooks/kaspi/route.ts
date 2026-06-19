import { NextResponse } from "next/server";
import { payments } from "@/lib/payments";

// Вебхук Kaspi Pay Merchant API v2 (режим auto).
// Тот же confirmPayment, что в ручном режиме дёргает оператор —
// здесь его дёргает Kaspi после проверки подписи. Остальной код не меняется.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  // TODO(auto): проверить подпись запроса ключом KASPI_API_KEY.
  // if (!verifySignature(req, body)) return NextResponse.json({ error: "bad signature" }, { status: 401 });

  const bookingId = String(body.bookingId ?? body.comment ?? "").replace(/^BOOKING-/, "");
  if (!bookingId) return NextResponse.json({ error: "no booking ref" }, { status: 400 });

  // Прими → подтверди (в проде: поставить в очередь Inngest, ответить 200 сразу).
  await payments.confirmPayment(bookingId);
  return NextResponse.json({ ok: true });
}
