import "server-only";
import { query, one } from "@/lib/db";
import type { StudentGoal, Result } from "@/lib/types";

// ============================================================
// Живые метрики дашбордов — из Lesson/Result/Booking. Где реальных
// данных ещё нет (cold-start), падаем на кэш TutorProfile.
// Дельту и удержание считает система, тютор их не редактирует.
// ============================================================

// Порог «мало данных» и псевдо-счёт усадки малой выборки к нулю (risk-adjust).
const MIN_N = 5;
const SHRINK_K = 4;

export interface LiveTutorMetrics {
  delta: number;             // сырая средняя дельта завершивших (заголовок)
  riskAdjustedDelta: number; // консервативно: бросившие = 0 прироста + усадка на малых N
  continuationRate: number;  // % дошедших до результата (не бросивших), 0..100
  n: number;                 // верифицированных дельт (завершившие) — база доказательства
  nTotal: number;            // завершившие + бросившие
  lessons: number;
  retention: number;         // вернулись на 2-й+ урок, 0..100
  sample: number;            // = n (обратная совместимость со старым кодом)
  lowConfidence: boolean;    // n < MIN_N → честная подпись «мало данных»
  isLive: boolean;
}

type StatRow = {
  statAfter: number;
  statBefore: number;
  statLessons: number;
  statRetention: number;
  statSample: number;
};

export async function computeTutorMetrics(tutorId: string): Promise<LiveTutorMetrics> {
  const [profile, lessons, results] = await Promise.all([
    one<StatRow>(
      `select "statAfter","statBefore","statLessons","statRetention","statSample"
       from "TutorProfile" where "userId" = $1`,
      [tutorId],
    ),
    query<{ studentId: string; sequenceNo: number }>(
      `select "studentId","sequenceNo" from "Lesson" where "tutorId" = $1`,
      [tutorId],
    ),
    query<{ delta: number | null; dropped: boolean }>(
      `select delta, dropped from "Result" where "tutorId" = $1 and status = 'delta_set'`,
      [tutorId],
    ),
  ]);

  const lessonsCount = lessons.length;
  const distinct = new Set(lessons.map((l) => l.studentId));
  const returning = new Set(lessons.filter((l) => l.sequenceNo >= 2).map((l) => l.studentId));
  const liveRetention = distinct.size ? Math.round((returning.size / distinct.size) * 100) : null;

  // Завершившие = есть дельта и не бросил; бросившие учитываются в знаменателях.
  const completers = results.filter((r) => !r.dropped && r.delta != null);
  const droppedCount = results.filter((r) => r.dropped).length;
  const n = completers.length;
  const nTotal = n + droppedCount;
  const sumDelta = completers.reduce((s, r) => s + (r.delta ?? 0), 0);

  const rawDelta = n ? round1(sumDelta / n) : null;
  // Risk-adjust: бросившие = 0 прироста, плюс усадка к нулю на малой выборке.
  const riskAdjusted = nTotal ? round1(sumDelta / (nTotal + SHRINK_K)) : null;
  const continuation = nTotal ? Math.round((n / nTotal) * 100) : null;

  const hasLive = lessonsCount > 0 || results.length > 0;
  const cachedDelta = round1((profile?.statAfter ?? 0) - (profile?.statBefore ?? 0));

  return {
    delta: rawDelta ?? cachedDelta,
    riskAdjustedDelta: riskAdjusted ?? cachedDelta,
    continuationRate: continuation ?? (profile?.statRetention ?? 0),
    n,
    nTotal,
    lessons: lessonsCount || (profile?.statLessons ?? 0),
    retention: liveRetention ?? (profile?.statRetention ?? 0),
    sample: n || (profile?.statSample ?? 0),
    lowConfidence: n < MIN_N,
    isLive: hasLive,
  };
}

export interface StudentProgress {
  exam: string | null;
  baseline: number | null;
  latest: number | null;
  delta: number | null;
  hasBaseline: boolean;
}

export async function computeStudentProgress(studentId: string): Promise<StudentProgress> {
  const [goal, results] = await Promise.all([
    one<StudentGoal>(`select * from "StudentGoal" where "userId" = $1`, [studentId]),
    query<Result>(`select * from "Result" where "studentId" = $1 order by "createdAt" desc`, [studentId]),
  ]);

  const verified = results.find((r) => r.status === "delta_set");
  const baselineFromGoal = goal?.baselineScore ? Number(goal.baselineScore) : null;
  const baseline =
    verified?.baseline ?? (Number.isFinite(baselineFromGoal) ? baselineFromGoal : null);
  const latest = verified?.finalScore ?? null;
  const delta =
    verified?.delta ?? (baseline != null && latest != null ? round1(latest - baseline) : null);

  return {
    exam: goal?.exam ?? null,
    baseline,
    latest,
    delta,
    hasBaseline: baseline != null,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
