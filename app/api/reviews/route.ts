import { NextResponse } from "next/server";
import { query, one } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { Booking } from "@/lib/types";

// Двусторонняя оценка после урока (UX §2.9 студент→тютор, §3.6 тютор→студент).
// Слабый сигнал, но skin-in-the-game у обеих сторон.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const bookingId = String(body.bookingId ?? "");
  const booking = await one<Booking>(`select * from "Booking" where id = $1`, [bookingId]);
  if (!booking) return NextResponse.json({ error: "Бронь не найдена" }, { status: 404 });

  const isStudent = booking.studentId === user.id;
  const isTutor = booking.tutorId === user.id;
  if (!isStudent && !isTutor)
    return NextResponse.json({ error: "Это не ваша бронь" }, { status: 403 });

  const byRole = isStudent ? "student" : "tutor";

  // Один отзыв на бронь от каждой стороны.
  const exists = await one(
    `select id from "Review" where "bookingId" = $1 and "byRole" = $2`,
    [bookingId, byRole],
  );
  if (exists) return NextResponse.json({ error: "Вы уже оценили" }, { status: 409 });

  let rating: number;
  let note: string;
  let targetType: string;
  let targetId: string;

  if (isStudent) {
    // Студент → тютор: шкала 1–5 + опц. строка.
    rating = Math.min(5, Math.max(1, parseInt(body.rating, 10) || 5));
    note = String(body.note ?? "").slice(0, 500);
    targetType = "tutor";
    targetId = booking.tutorId;
  } else {
    // Тютор → студент: пара тапов «вовремя? / ДЗ?».
    const onTime = Boolean(body.onTime);
    const homework = Boolean(body.homework);
    rating = 3 + (onTime ? 1 : 0) + (homework ? 1 : 0);
    note = [onTime ? "пришёл вовремя" : "опоздал/не пришёл", homework ? "ДЗ сделал" : "без ДЗ"].join(" · ");
    targetType = "student";
    targetId = booking.studentId;
  }

  await query(
    `insert into "Review" ("bookingId","authorId","authorName","byRole","targetType","targetId",rating,note,verified)
     values ($1,$2,$3,$4,$5,$6,$7,$8,true)`,
    [bookingId, user.id, user.name, byRole, targetType, targetId, rating, note],
  );

  // Пересчитать рейтинг тютора как среднее его отзывов (живой сигнал на витрине).
  if (targetType === "tutor") {
    await query(
      `update "TutorProfile" set rating = coalesce((
         select round(avg(rating)::numeric, 1) from "Review"
         where "targetType" = 'tutor' and "targetId" = $1
       ), rating) where "userId" = $1`,
      [targetId],
    );
  }

  return NextResponse.json({ ok: true });
}
