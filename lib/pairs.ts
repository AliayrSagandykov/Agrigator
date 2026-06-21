import "server-only";
import { query, one } from "@/lib/db";
import type { Pair, RoomItem, Submission, ProgressPt, Message, Lesson } from "@/lib/types";

// ============================================================
// Кабинет пары (UX v3 §2): создаётся при подтверждении первой брони,
// один на пару (студент+тютор), персистентный. Держит связку
// домашкой/материалами/прогрессом — то, что Telegram не умеет.
// ============================================================

/** Идемпотентно: вернуть существующий кабинет пары или создать новый. */
export async function ensurePair(studentId: string, tutorId: string, subject: string): Promise<string> {
  const created = await one<{ id: string }>(
    `insert into "Pair" ("studentId","tutorId",subject) values ($1,$2,$3)
     on conflict ("studentId","tutorId") do nothing returning id`,
    [studentId, tutorId, subject],
  );
  if (created) return created.id;
  const existing = await one<{ id: string }>(
    `select id from "Pair" where "studentId" = $1 and "tutorId" = $2`,
    [studentId, tutorId],
  );
  return existing!.id;
}

/** Создать/вернуть кабинет по брони (subject = цель студента). Идемпотентно. */
export async function ensurePairForBooking(bookingId: string): Promise<string | null> {
  const b = await one<{ studentId: string; tutorId: string }>(
    `select "studentId", "tutorId" from "Booking" where id = $1`,
    [bookingId],
  );
  if (!b) return null;
  const goal = await one<{ exam: string }>(`select exam from "StudentGoal" where "userId" = $1`, [b.studentId]);
  return ensurePair(b.studentId, b.tutorId, goal?.exam ?? "");
}

/** Лёгкая проверка членства в паре для write-роутов. */
export function getPairMembership(pairId: string) {
  return one<{ studentId: string; tutorId: string; subject: string }>(
    `select "studentId", "tutorId", subject from "Pair" where id = $1`,
    [pairId],
  );
}

export interface Person {
  id: string;
  name: string;
  avatarColor: string | null;
  timezone: string | null;
}

export interface PairView {
  pair: Pair;
  student: Person;
  tutor: Person;
  viewerRole: "student" | "tutor";
}

/** Кабинет с проверкой доступа: вернёт null, если пользователь не из пары и не админ. */
export async function getPairForUser(
  pairId: string,
  userId: string,
  isAdmin: boolean,
): Promise<PairView | null> {
  const row = await one<
    Pair & {
      studentName: string; studentColor: string | null; studentTz: string | null;
      tutorName: string; tutorColor: string | null; tutorTz: string | null;
    }
  >(
    `select p.*,
            s.name as "studentName", s."avatarColor" as "studentColor", s.timezone as "studentTz",
            t.name as "tutorName", t."avatarColor" as "tutorColor", t.timezone as "tutorTz"
     from "Pair" p
     join "User" s on s.id = p."studentId"
     join "User" t on t.id = p."tutorId"
     where p.id = $1`,
    [pairId],
  );
  if (!row) return null;
  if (!isAdmin && row.studentId !== userId && row.tutorId !== userId) return null;

  return {
    pair: { id: row.id, studentId: row.studentId, tutorId: row.tutorId, subject: row.subject, status: row.status, createdAt: row.createdAt },
    student: { id: row.studentId, name: row.studentName, avatarColor: row.studentColor, timezone: row.studentTz },
    tutor: { id: row.tutorId, name: row.tutorName, avatarColor: row.tutorColor, timezone: row.tutorTz },
    viewerRole: row.tutorId === userId ? "tutor" : "student",
  };
}

export interface PairCard {
  id: string;
  subject: string;
  status: string;
  visavi: Person;
  nextSlotAt: Date | null;
}

/** Список кабинетов пользователя (для дашборда). visavi = вторая сторона. */
export async function getPairsForUser(userId: string): Promise<PairCard[]> {
  const rows = await query<{
    id: string; subject: string; status: string;
    visaviId: string; visaviName: string; visaviColor: string | null; visaviTz: string | null;
    nextSlotAt: Date | null;
  }>(
    `select p.id, p.subject, p.status,
            v.id as "visaviId", v.name as "visaviName", v."avatarColor" as "visaviColor", v.timezone as "visaviTz",
            (select min(b."slotAt") from "Booking" b
             where b."studentId" = p."studentId" and b."tutorId" = p."tutorId"
               and b."slotAt" > now() and b.status <> 'cancelled') as "nextSlotAt"
     from "Pair" p
     join "User" v on v.id = case when p."studentId" = $1 then p."tutorId" else p."studentId" end
     where p."studentId" = $1 or p."tutorId" = $1
     order by p."createdAt" desc`,
    [userId],
  );
  return rows.map((r) => ({
    id: r.id, subject: r.subject, status: r.status,
    visavi: { id: r.visaviId, name: r.visaviName, avatarColor: r.visaviColor, timezone: r.visaviTz },
    nextSlotAt: r.nextSlotAt,
  }));
}

// ── Загрузчики разделов кабинета ──

export function getMaterials(pairId: string): Promise<RoomItem[]> {
  return query<RoomItem>(
    `select * from "RoomItem" where "pairId" = $1 and type = 'material' order by "createdAt" desc`,
    [pairId],
  );
}

export interface HomeworkWithSubmission extends RoomItem {
  submission: Submission | null;
}

export async function getHomeworks(pairId: string): Promise<HomeworkWithSubmission[]> {
  const items = await query<RoomItem>(
    `select * from "RoomItem" where "pairId" = $1 and type = 'homework' order by coalesce("dueAt", "createdAt") desc`,
    [pairId],
  );
  if (items.length === 0) return [];
  const subs = await query<Submission>(
    `select * from "Submission" where "homeworkId" = any($1::text[]) order by "submittedAt" desc`,
    [items.map((i) => i.id)],
  );
  const byHw = new Map<string, Submission>();
  for (const s of subs) if (!byHw.has(s.homeworkId)) byHw.set(s.homeworkId, s);
  return items.map((i) => ({ ...i, submission: byHw.get(i.id) ?? null }));
}

export function getProgress(pairId: string): Promise<ProgressPt[]> {
  return query<ProgressPt>(
    `select * from "ProgressPt" where "pairId" = $1 order by "takenAt" asc`,
    [pairId],
  );
}

export function getMessages(pairId: string): Promise<(Message & { authorName: string | null })[]> {
  return query<Message & { authorName: string | null }>(
    `select m.*, u.name as "authorName" from "Message" m
     left join "User" u on u.id = m."authorId"
     where m."pairId" = $1 order by m."createdAt" asc limit 200`,
    [pairId],
  );
}

/** Уроки пары (история) — по studentId+tutorId. */
export function getPairLessons(studentId: string, tutorId: string): Promise<Lesson[]> {
  return query<Lesson>(
    `select * from "Lesson" where "studentId" = $1 and "tutorId" = $2 order by "happenedAt" desc`,
    [studentId, tutorId],
  );
}

export interface PairBooking {
  id: string;
  slotAt: Date;
  meetLink: string;
  status: string;
  acceptedAt: Date | null;
  kind: string;
}

/** Будущие уроки пары (раздел «Расписание»). */
export function getPairUpcoming(studentId: string, tutorId: string): Promise<PairBooking[]> {
  return query<PairBooking>(
    `select id, "slotAt", "meetLink", status, "acceptedAt", kind from "Booking"
     where "studentId" = $1 and "tutorId" = $2 and "slotAt" > now() and status <> 'cancelled'
     order by "slotAt" asc`,
    [studentId, tutorId],
  );
}
