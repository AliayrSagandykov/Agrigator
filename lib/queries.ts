import "server-only";
import { query, one } from "@/lib/db";
import type { Review, Lead } from "@/lib/types";

// ============================================================
// Реляционные чтения для страниц (вместо prisma include).
// Возвращают готовые к рендеру формы.
// ============================================================

export interface StudentBookingRow {
  id: string;
  slotAt: Date;
  status: string;
  kind: string;
  meetLink: string;
  hasLesson: boolean;
  acceptedAt: Date | null;
  paymentStatus: string | null;
  tutor: { id: string; name: string; avatarColor: string | null };
}

export async function getStudentBookings(studentId: string): Promise<StudentBookingRow[]> {
  const rows = await query<{
    id: string; slotAt: Date; status: string; kind: string; meetLink: string;
    hasLesson: boolean; acceptedAt: Date | null; paymentStatus: string | null;
    tutorId: string; tutorName: string; tutorAvatarColor: string | null;
  }>(
    `select b.id, b."slotAt", b.status, b.kind, b."meetLink", b."acceptedAt",
            (l.id is not null) as "hasLesson",
            pay.status as "paymentStatus",
            u.id as "tutorId", u.name as "tutorName", u."avatarColor" as "tutorAvatarColor"
     from "Booking" b
     join "User" u on u.id = b."tutorId"
     left join "Lesson" l on l."bookingId" = b.id
     left join "Payment" pay on pay."bookingId" = b.id
     where b."studentId" = $1
     order by b."slotAt" desc`,
    [studentId],
  );
  return rows.map((r) => ({
    id: r.id, slotAt: r.slotAt, status: r.status, kind: r.kind, meetLink: r.meetLink,
    hasLesson: r.hasLesson, acceptedAt: r.acceptedAt, paymentStatus: r.paymentStatus,
    tutor: { id: r.tutorId, name: r.tutorName, avatarColor: r.tutorAvatarColor },
  }));
}

export interface TutorBookingRow {
  id: string;
  slotAt: Date;
  status: string;
  kind: string;
  meetLink: string;
  hasLesson: boolean;
  acceptedAt: Date | null;
  student: { name: string; avatarColor: string | null };
}

export async function getTutorBookings(tutorId: string): Promise<TutorBookingRow[]> {
  const rows = await query<{
    id: string; slotAt: Date; status: string; kind: string; meetLink: string;
    hasLesson: boolean; acceptedAt: Date | null; studentName: string; studentAvatarColor: string | null;
  }>(
    `select b.id, b."slotAt", b.status, b.kind, b."meetLink", b."acceptedAt",
            (l.id is not null) as "hasLesson",
            u.name as "studentName", u."avatarColor" as "studentAvatarColor"
     from "Booking" b
     join "User" u on u.id = b."studentId"
     left join "Lesson" l on l."bookingId" = b.id
     where b."tutorId" = $1
     order by b."slotAt" asc`,
    [tutorId],
  );
  return rows.map((r) => ({
    id: r.id, slotAt: r.slotAt, status: r.status, kind: r.kind, meetLink: r.meetLink,
    hasLesson: r.hasLesson, acceptedAt: r.acceptedAt,
    student: { name: r.studentName, avatarColor: r.studentAvatarColor },
  }));
}

export async function getTutorPayments(tutorId: string): Promise<{ status: string; amount: number }[]> {
  return query<{ status: string; amount: number }>(
    `select pay.status, pay.amount
     from "Payment" pay join "Booking" b on b.id = pay."bookingId"
     where b."tutorId" = $1`,
    [tutorId],
  );
}

export function getReviewsFor(targetType: string, targetId: string): Promise<Review[]> {
  return query<Review>(
    `select * from "Review" where "targetType" = $1 and "targetId" = $2 order by "createdAt" desc`,
    [targetType, targetId],
  );
}

export interface PendingPaymentRow {
  id: string;
  bookingId: string;
  amount: number;
  createdAt: Date;
  studentName: string;
  tutorName: string;
}

export function getPendingPayments(): Promise<PendingPaymentRow[]> {
  return query<PendingPaymentRow>(
    `select pay.id, pay."bookingId", pay.amount, pay."createdAt",
            s.name as "studentName", t.name as "tutorName"
     from "Payment" pay
     join "Booking" b on b.id = pay."bookingId"
     join "User" s on s.id = b."studentId"
     join "User" t on t.id = b."tutorId"
     where pay.status = 'pending'
     order by pay."createdAt" desc`,
  );
}

export interface SubmittedResultRow {
  id: string;
  exam: string;
  baseline: number | null;
  reportUrl: string;
  studentName: string;
  tutorName: string;
}

export function getSubmittedResults(): Promise<SubmittedResultRow[]> {
  return query<SubmittedResultRow>(
    `select r.id, r.exam, r.baseline, r."reportUrl",
            s.name as "studentName", t.name as "tutorName"
     from "Result" r
     join "User" s on s.id = r."studentId"
     join "User" t on t.id = r."tutorId"
     where r.status = 'submitted'
     order by r."createdAt" desc`,
  );
}

export function getLeads(): Promise<Lead[]> {
  return query<Lead>(`select * from "Lead" order by "foundAt" desc`);
}

/** bookingId, которые этот автор уже оценил (чтобы не просить повторно). */
export async function getReviewedBookingIds(authorId: string): Promise<Set<string>> {
  const rows = await query<{ bookingId: string }>(
    `select "bookingId" from "Review" where "authorId" = $1 and "bookingId" is not null`,
    [authorId],
  );
  return new Set(rows.map((r) => r.bookingId));
}

export async function getAdminCounts() {
  const row = await one<{ tutors: string; students: string; bookings: string; lessons: string }>(
    `select
       (select count(*) from "User" where role = 'tutor')    as tutors,
       (select count(*) from "User" where role = 'student')  as students,
       (select count(*) from "Booking")                       as bookings,
       (select count(*) from "Lesson")                        as lessons`,
  );
  return {
    tutors: Number(row?.tutors ?? 0),
    students: Number(row?.students ?? 0),
    bookings: Number(row?.bookings ?? 0),
    lessons: Number(row?.lessons ?? 0),
  };
}
