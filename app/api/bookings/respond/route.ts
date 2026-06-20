import { NextResponse } from "next/server";
import { query, one } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { Booking } from "@/lib/types";

// Тютор отвечает на бронь (UX §3.2): принять / отклонить / предложить другое время.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const bookingId = String(body.bookingId ?? "");
  const action = String(body.action ?? "");

  const booking = await one<Booking>(`select * from "Booking" where id = $1`, [bookingId]);
  if (!booking) return NextResponse.json({ error: "Бронь не найдена" }, { status: 404 });
  if (user.role !== "admin" && booking.tutorId !== user.id)
    return NextResponse.json({ error: "Это не ваша бронь" }, { status: 403 });

  if (action === "accept") {
    await query(`update "Booking" set "acceptedAt" = now() where id = $1`, [bookingId]);
  } else if (action === "decline") {
    await query(`update "Booking" set status = 'cancelled' where id = $1`, [bookingId]);
  } else if (action === "reschedule") {
    const slotAt = new Date(String(body.slotAt ?? ""));
    if (Number.isNaN(slotAt.getTime()))
      return NextResponse.json({ error: "Неверное время" }, { status: 400 });
    await query(`update "Booking" set "slotAt" = $1, "acceptedAt" = now() where id = $2`, [slotAt, bookingId]);
  } else {
    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
