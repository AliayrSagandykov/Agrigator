import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createBooking } from "@/lib/bookings";
import { payments } from "@/lib/payments";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });
  if (user.role === "tutor")
    return NextResponse.json({ error: "Бронирует ученик, не тютор" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const tutorId = String(body.tutorId ?? "");
  const slotAt = new Date(String(body.slotAt ?? ""));
  const kind = body.kind === "regular" ? "regular" : "trial";
  const note = String(body.note ?? "");

  if (!tutorId) return NextResponse.json({ error: "Не указан тютор" }, { status: 400 });
  if (Number.isNaN(slotAt.getTime()))
    return NextResponse.json({ error: "Неверный слот" }, { status: 400 });

  const profile = await one<{ price: number; trialFree: boolean }>(
    `select price, "trialFree" from "TutorProfile" where "userId" = $1`,
    [tutorId],
  );
  if (!profile) return NextResponse.json({ error: "Тютор не найден" }, { status: 404 });

  const booking = await createBooking({ studentId: user.id, tutorId, slotAt, kind, note });

  const free = kind === "trial" && profile.trialFree;
  const amount = free ? 0 : profile.price;
  let payUrl = "";
  if (!free) {
    const charge = await payments.createCharge({ bookingId: booking.id, amount });
    payUrl = charge.payUrl;
  }

  return NextResponse.json({
    booking: { id: booking.id, meetLink: booking.meetLink, slotAt: booking.slotAt, status: booking.status },
    amount,
    free,
    payUrl,
    paymentMode: payments.mode,
  });
}
