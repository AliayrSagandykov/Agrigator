// ============================================================
// Матч ученик→тютор (UX §2.3).
// Честный матч: жёсткий фильтр по экзамену, ранжирование по
// ВЕРИФИЦИРОВАННЫМ метрикам (дельта, размер выборки, удержание,
// passRate, рейтинг). Никаких звёздочек как главного сигнала.
// ============================================================

export interface TutorMatchInput {
  id: string;
  exams: string[];
  delta: number;
  sample: number;
  retention: number;
  passRate: number;
  rating: number;
  aiVerified: boolean;
  price: number;
}

export interface StudentVector {
  exam: string;
  deadline: string; // "1-2m" | "3-6m" | "flex"
  pace: string; // "slow" | "fast"
  style: string; // "strict" | "soft"
}

export interface RankedTutor {
  id: string;
  percent: number;
  reasons: string[];
}

/** Нормализованный 0..1 вклад «больше — лучше» с насыщением. */
function saturate(value: number, full: number): number {
  if (full <= 0) return 0;
  return Math.max(0, Math.min(1, value / full));
}

export function scoreTutor(t: TutorMatchInput, v: StudentVector): RankedTutor {
  const reasons: string[] = [];

  const examMatch = t.exams.includes(v.exam);
  if (examMatch) reasons.push(`готовит к ${v.exam}`);

  // Доверие = верифицированная дельта × достаточная выборка.
  const deltaScore = saturate(t.delta, 2); // +2 балла дельты ≈ потолок
  const sampleScore = saturate(t.sample, 100);
  const retentionScore = saturate(t.retention, 90);
  const passScore = saturate(t.passRate, 90);
  const ratingScore = saturate(t.rating, 5);

  if (t.aiVerified) reasons.push("результаты верифицированы");
  if (t.retention >= 70) reasons.push(`удержание ${t.retention}%`);
  if (t.sample >= 50) reasons.push(`выборка ${t.sample} учеников`);

  // Срочный дедлайн → выше ценятся проверенные «сдают с первого раза».
  const urgencyWeight = v.deadline === "1-2m" ? 1.2 : 1;

  const trust =
    0.34 * deltaScore +
    0.22 * retentionScore +
    0.18 * sampleScore +
    0.16 * passScore * urgencyWeight +
    0.1 * ratingScore;

  // Экзамен — жёсткий гейт: без совпадения резкий штраф (но не 0, на случай пустой выдачи).
  const base = examMatch ? trust : trust * 0.15;
  const percent = Math.round(Math.min(0.99, base) * 100);

  return { id: t.id, percent, reasons: reasons.slice(0, 3) };
}

export function rankTutors(tutors: TutorMatchInput[], v: StudentVector): RankedTutor[] {
  return tutors
    .map((t) => scoreTutor(t, v))
    .sort((a, b) => b.percent - a.percent);
}
