// ============================================================
// Матч ученик→тютор (UX §2.3, v3 §5).
// Честный матч: жёсткий фильтр по экзамену, ранжирование по
// ВЕРИФИЦИРОВАННЫМ метрикам с поправкой на выборку (дельта усаживается
// к нулю на малых N — не награждаем выживших), плюс совместимость
// часовых поясов для онлайн-уроков. Без «стилей обучения» (v3).
// ============================================================
import { tzCompatibility, tzOffsetMinutes } from "@/lib/time";
import { normalizeLevel, levelBucket, deadlineToHorizon, type Band, type MatchPrefs } from "@/lib/onboarding-data";

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
  teachBands?: Record<string, Band>; // «кому помогаю» по экзаменам (матч-тест)
  prefs?: MatchPrefs;                // каденс / горизонт / уровни / подход
}

export interface StudentVector {
  exam: string;
  deadline: string; // "1-2m" | "3-6m" | "6m+" | "flex"
  timezone?: string | null;
  level?: number | null;  // нормализованный 0..1 стартовый уровень
  target?: number | null; // нормализованный 0..1 целевой балл
  cadence?: string | null;   // "1" | "2" | "3" | "4+"
  approach?: string[];       // предпочитаемые подходы
}

/**
 * Попадание уровня студента в бэнд тютора, 0..1. Внутри диапазона = 1,
 * за его пределами — линейный спад на 25% шкалы. null уровень → нейтрально.
 */
function bandFit(band: Band | undefined, exam: string, level?: number | null): number | null {
  if (!band || level == null) return null;
  const a = normalizeLevel(exam, band.from);
  const b = normalizeLevel(exam, band.to);
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  if (level >= lo && level <= hi) return 1;
  const dist = level < lo ? lo - level : level - hi;
  return Math.max(0, 1 - dist / 0.25);
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
  let base = examMatch ? trust : trust * 0.15;

  // Совместимость матч-теста (бэнд · каденс · горизонт · уровень · подход):
  // мягкий нудж ±12% поверх верифицированных метрик — персонализирует порядок,
  // но не перебивает доказанный результат (честный матч).
  if (examMatch) {
    let sum = 0;
    let n = 0;
    const add = (fit: number | null) => { if (fit != null) { sum += fit; n++; } };

    // Бэнд: целевой балл (или старт) попадает в диапазон тютора.
    const lvlForBand = v.target ?? v.level;
    const bf = bandFit(t.teachBands?.[v.exam], v.exam, lvlForBand);
    add(bf);
    if (bf != null && bf >= 0.99) reasons.splice(1, 0, "в твоём диапазоне баллов");

    // Частота занятий.
    if (t.prefs?.cadence?.length && v.cadence) {
      const ok = t.prefs.cadence.includes(v.cadence);
      add(ok ? 1 : 0);
      if (ok) reasons.push("совпал график");
    }
    // Горизонт подготовки (из срока экзамена).
    if (t.prefs?.horizon?.length && v.deadline) {
      add(t.prefs.horizon.includes(deadlineToHorizon(v.deadline)) ? 1 : 0);
    }
    // Уровень студента в фокусе тютора.
    if (t.prefs?.levels?.length && v.level != null) {
      add(t.prefs.levels.includes(levelBucket(v.level)) ? 1 : 0);
    }
    // Пересечение по подходу.
    if (t.prefs?.approach?.length && v.approach?.length) {
      const ok = v.approach.some((a) => t.prefs!.approach.includes(a));
      add(ok ? 1 : 0);
      if (ok) reasons.push("совпал подход");
    }

    if (n > 0) base *= 0.88 + 0.24 * (sum / n);
  }

  const percent = Math.round(Math.min(0.99, base) * 100);

  return { id: t.id, percent, reasons: reasons.slice(0, 3) };
}

export function rankTutors(tutors: TutorMatchInput[], v: StudentVector): RankedTutor[] {
  return tutors
    .map((t) => scoreTutor(t, v))
    .sort((a, b) => b.percent - a.percent);
}
