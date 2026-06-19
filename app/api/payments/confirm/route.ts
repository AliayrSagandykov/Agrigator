import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { payments } from "@/lib/payments";

// Ручной режим: подтверждает оператор (admin) из /admin.
// Auto-режим: тот же confirmPayment дёргает вебхук Kaspi (app/api/webhooks/kaspi).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Только для оператора" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const bookingId = String(body.bookingId ?? "");
  if (!bookingId) return NextResponse.json({ error: "Не указана бронь" }, { status: 400 });

  await payments.confirmPayment(bookingId);
  return NextResponse.json({ ok: true });
}
