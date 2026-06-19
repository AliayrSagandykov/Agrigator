import "server-only";
import { query, one } from "@/lib/db";
import type { StudentGoal, Result } from "@/lib/types";

// ============================================================
// Живые метрики дашбордов — из Lesson/Result/Booking. Где реальных
// данных ещё нет (cold-start), падаем на кэш TutorProfile.
// Дельту и удержание считает система, тютор их не редактирует.
// ============================================================

export interface LiveTutorMetrics {
  delta: number;
  lessons: number;
  retention: number;
  sample: number;
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
    query<{ delta: number }>(
      `select delta from "Result" where "tutorId" = $1 and status = 'delta_set' and delta is not null`,
      [tutorId],
    ),
  ]);

  const lessonsCount = lessons.length;
  const distinct = new Set(lessons.map((l) => l.studentId));
  const returning = new Set(lessons.filter((l) => l.sequenceNo >= 2).map((l) => l.studentId));
  const liveRetention = distinct.size ? Math.round((returning.size / distinct.size) * 100) : null;
  const liveDelta = results.length
    ? Math.round((results.reduce((s, r) => s + (r.delta ?? 0), 0) / results.length) * 10) / 10
    : null;

  const hasLive = lessonsCount > 0 || results.length > 0;

  return {
    delta: liveDelta ?? round1((profile?.statAfter ?? 0) - (profile?.statBefore ?? 0)),
    lessons: lessonsCount || (profile?.statLessons ?? 0),
    retention: liveRetention ?? (profile?.statRetention ?? 0),
    sample: results.length || (profile?.statSample ?? 0),
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
