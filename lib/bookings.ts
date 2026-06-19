import "server-only";
import { prisma } from "@/lib/db";
import { generateMeetLink } from "@/lib/meet";

// ============================================================
// Бронь и урок. Логистика — побочный эффект полезного действия:
// принятая бронь = слот + авто-ссылка, тютор пальцем не шевелит (UX §2.5/3.2).
// ============================================================

export interface CreateBookingInput {
  studentId: string;
  tutorId: string;
  slotAt: Date;
  kind?: "trial" | "regular";
  note?: string;
}

export async function createBooking(input: CreateBookingInput) {
  const booking = await prisma.booking.create({
    data: {
      studentId: input.studentId,
      tutorId: input.tutorId,
      slotAt: input.slotAt,
      kind: input.kind ?? "trial",
      note: input.note ?? "",
      status: "created",
    },
  });

  // Система сама генерит ссылку на видео-урок → сигнал «слот существует».
  const meetLink = generateMeetLink(booking.id);
  return prisma.booking.update({
    where: { id: booking.id },
    data: { meetLink },
  });
}

/**
 * Урок состоялся: booking → completed, создаём Lesson с порядковым номером
 * пары (студент+тютор). sequenceNo>=2 = вернувшийся ученик (удержание).
 */
export async function markLessonHappened(bookingId: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Бронь не найдена");

  const existing = await prisma.lesson.findUnique({ where: { bookingId } });
  if (existing) return booking; // идемпотентность

  const priorCount = await prisma.lesson.count({
    where: { studentId: booking.studentId, tutorId: booking.tutorId },
  });

  await prisma.$transaction([
    prisma.lesson.create({
      data: {
        bookingId,
        studentId: booking.studentId,
        tutorId: booking.tutorId,
        happenedAt: new Date(),
        sequenceNo: priorCount + 1,
      },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: "completed" },
    }),
  ]);

  return prisma.booking.findUnique({ where: { id: bookingId } });
}
