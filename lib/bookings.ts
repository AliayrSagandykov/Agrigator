import "server-only";
import { query, one, withTransaction } from "@/lib/db";
import { generateMeetLink } from "@/lib/meet";
import { ensurePairForBooking } from "@/lib/pairs";
import type { Booking } from "@/lib/types";

// ============================================================
// Бронь и урок. Логистика — побочный эффект полезного действия:
// принятая бронь = слот + авто-ссылка (UX §2.5/3.2).
// ============================================================

export interface CreateBookingInput {
  studentId: string;
  tutorId: string;
  slotAt: Date;
  kind?: "trial" | "regular";
  note?: string;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const created = await one<Booking>(
    `insert into "Booking" ("studentId","tutorId","slotAt",kind,note,status)
     values ($1,$2,$3,$4,$5,'created') returning *`,
    [input.studentId, input.tutorId, input.slotAt, input.kind ?? "trial", input.note ?? ""],
  );
  if (!created) throw new Error("Не удалось создать бронь");

  // Система сама генерит ссылку на видео-урок → сигнал «слот существует».
  const meetLink = generateMeetLink(created.id);
  const updated = await one<Booking>(
    `update "Booking" set "meetLink" = $1 where id = $2 returning *`,
    [meetLink, created.id],
  );
  return updated!;
}

/**
 * Урок состоялся: booking → completed, создаём Lesson с порядковым номером
 * пары (студент+тютор). sequenceNo>=2 = вернувшийся ученик (удержание).
 */
export async function markLessonHappened(bookingId: string): Promise<Booking | null> {
  const booking = await one<Booking>(`select * from "Booking" where id = $1`, [bookingId]);
  if (!booking) throw new Error("Бронь не найдена");

  const existing = await one(`select id from "Lesson" where "bookingId" = $1`, [bookingId]);
  if (existing) return booking; // идемпотентность

  const countRow = await one<{ n: string }>(
    `select count(*)::text as n from "Lesson" where "studentId" = $1 and "tutorId" = $2`,
    [booking.studentId, booking.tutorId],
  );
  const sequenceNo = Number(countRow?.n ?? 0) + 1;

  await withTransaction(async (c) => {
    await c.query(
      `insert into "Lesson" ("bookingId","studentId","tutorId","happenedAt","sequenceNo")
       values ($1,$2,$3,now(),$4)`,
      [bookingId, booking.studentId, booking.tutorId, sequenceNo],
    );
    await c.query(`update "Booking" set status = 'completed' where id = $1`, [bookingId]);
  });

  await ensurePairForBooking(bookingId); // на всякий случай: урок без пары → создаём
  return one<Booking>(`select * from "Booking" where id = $1`, [bookingId]);
}
