// ============================================================
// Матч ученик→тютор (UX §2.3, v3 §5).
// Честный матч: жёсткий фильтр по экзамену, ранжирование по
// ВЕРИФИЦИРОВАННЫМ метрикам с поправкой на выборку (дельта усаживается
// к нулю на малых N — не награждаем выживших), плюс совместимость
// часовых поясов для онлайн-уроков. Без «стилей обучения» (v3).
// ============================================================
import { tzCompatibility, tzOffsetMinutes } from "@/lib/time";

const SHRINK_K = 4; // псевдо-счёт усадки малой выборки

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
  timezone?: string | null;
}

export interface StudentVector {
  exam: string;
  deadline: string; // "1-2m" | "3-6m" | "flex"
  timezone?: string | null;
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

  // Доверие = дельта, усаженная к нулю на малой выборке (risk-adjust):
  // тютор с +2.0 на 3 учениках не должен обгонять +1.5 на 80.
  const shrunkDelta = t.delta * (t.sample / (t.sample + SHRINK_K));
  const deltaScore = saturate(shrunkDelta, 2); // +2 балла дельты ≈ потолок
  const sampleScore = saturate(t.sample, 100);
  const retentionScore = saturate(t.retention, 90);
  const passScore = saturate(t.passRate, 90);
  const ratingScore = saturate(t.rating, 5);
  const tzScore = tzCompatibility(t.timezone, v.timezone);

  if (t.aiVerified) reasons.push("результаты верифицированы");
  if (t.retention >= 70) reasons.push(`удержание ${t.retention}%`);
  if (t.sample >= 50) reasons.push(`выборка ${t.sample} учеников`);
  if (v.timezone && t.timezone && Math.abs(tzOffsetMinutes(t.timezone) - tzOffsetMinutes(v.timezone)) <= 120)
    reasons.push("удобный часовой пояс");

  // Срочный дедлайн → выше ценятся проверенные «сдают с первого раза».
  const urgencyWeight = v.deadline === "1-2m" ? 1.2 : 1;

  const trust =
    0.30 * deltaScore +
    0.20 * retentionScore +
    0.16 * sampleScore +
    0.14 * passScore * urgencyWeight +
    0.12 * tzScore +
    0.08 * ratingScore;

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
