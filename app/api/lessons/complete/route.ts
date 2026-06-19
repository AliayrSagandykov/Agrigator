import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { markLessonHappened } from "@/lib/bookings";

// «Урок состоялся» — на проде выводится из календаря (event прошёл).
// Здесь тютор/оператор фиксирует факт вручную (день-0).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const bookingId = String(body.bookingId ?? "");
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return NextResponse.json({ error: "Бронь не найдена" }, { status: 404 });
  if (user.role !== "admin" && booking.tutorId !== user.id)
    return NextResponse.json({ error: "Это не ваша бронь" }, { status: 403 });

  await markLessonHappened(bookingId);
  return NextResponse.json({ ok: true });
}
