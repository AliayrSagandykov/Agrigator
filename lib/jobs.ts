import "server-only";
import { query } from "@/lib/db";
import { notifyOperator } from "@/lib/notify";

// ============================================================
// Фоновые задачи (зовутся из app/api/cron/* по расписанию Vercel Cron).
// Те же переходы состояний, что и в ручном режиме — просто триггер крон.
// ============================================================

/** Авто-выплата: эскроу по проведённым урокам → released, бронь → settled. */
export async function releaseEarnedPayouts(): Promise<number> {
  const rows = await query<{ id: string }>(
    `with released as (
       update "Payment" pay set status = 'released', "releasedAt" = now()
       from "Booking" b
       where pay."bookingId" = b.id and pay.status = 'confirmed' and b.status = 'completed'
       returning b.id as bid
     )
     update "Booking" set status = 'settled' where id in (select bid from released) returning id`,
  );
  return rows.length;
}

/**
 * Скан удержания: пары (студент, тютор), у которых последний урок >7 дней назад,
 * нет будущей брони и ещё не отвечали на ретеншн-вопрос. Пингуем оператора —
 * это и есть триггер «нет переброни N дней» (UX §2.10, тех-док §4).
 */
export async function scanRetention(): Promise<number> {
  const pairs = await query<{ studentId: string; tutorId: string }>(
    `select x."studentId", x."tutorId"
     from (
       select l."studentId", l."tutorId", max(l."happenedAt") as last
       from "Lesson" l
       group by l."studentId", l."tutorId"
       having max(l."happenedAt") < now() - interval '7 days'
     ) x
     where not exists (
       select 1 from "Booking" b
       where b."studentId" = x."studentId" and b."tutorId" = x."tutorId"
         and b."slotAt" > now() and b.status <> 'cancelled'
     )
     and not exists (
       select 1 from "RetentionSignal" r
       where r."studentId" = x."studentId" and r."tutorId" = x."tutorId"
     )`,
  );

  if (pairs.length) {
    await notifyOperator({ type: "retention_due", count: pairs.length });
  }
  return pairs.length;
}
