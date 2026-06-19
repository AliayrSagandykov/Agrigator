import "server-only";
import { prisma } from "@/lib/db";

// ============================================================
// Живые метрики для дашбордов — считаются из Lesson/Result/Booking.
// Где реальных данных ещё нет (cold-start), падаем на кэш TutorProfile.
// Тютор НЕ редактирует ни дельту, ни удержание — только система.
// ============================================================

export interface LiveTutorMetrics {
  delta: number; // средняя верифицированная дельта
  lessons: number; // проведённых уроков
  retention: number; // % вернувшихся учеников
  sample: number; // верифицированных учеников (с дельтой)
  isLive: boolean; // есть ли реальные данные поверх кэша
}

export async function computeTutorMetrics(tutorId: string): Promise<LiveTutorMetrics> {
  const profile = await prisma.tutorProfile.findUnique({ where: { userId: tutorId } });

  const lessons = await prisma.lesson.findMany({
    where: { tutorId },
    select: { studentId: true, sequenceNo: true },
  });

  const results = await prisma.result.findMany({
    where: { tutorId, status: "delta_set", delta: { not: null } },
    select: { delta: true },
  });

  const lessonsCount = lessons.length;
  const distinct = new Set(lessons.map((l) => l.studentId));
  const returning = new Set(
    lessons.filter((l) => l.sequenceNo >= 2).map((l) => l.studentId),
  );
  const liveRetention = distinct.size
    ? Math.round((returning.size / distinct.size) * 100)
    : null;
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
  const goal = await prisma.studentGoal.findUnique({ where: { userId: studentId } });
  const results = await prisma.result.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
  const verified = results.find((r) => r.status === "delta_set");

  const baselineFromGoal = goal?.baselineScore ? Number(goal.baselineScore) : null;
  const baseline =
    verified?.baseline ?? (Number.isFinite(baselineFromGoal) ? baselineFromGoal : null);
  const latest = verified?.finalScore ?? null;
  const delta =
    verified?.delta ??
    (baseline != null && latest != null ? round1(latest - baseline) : null);

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
