// ============================================================
// Матч ученик→тютор (UX §2.3, v3 §5).
// Честный матч: жёсткий гейт по экзамену, ранжирование по
// ВЕРИФИЦИРОВАННЫМ метрикам с поправкой на выборку (дельта усаживается
// к нулю на малых N), плюс совместимость формата, языка и часовых поясов.
// Пустые предпочтения (=«без разницы») ничего не штрафуют.
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
  format: string; // online | offline | hybrid
  languages: string[]; // человекочитаемые ("Казахский", "Русский", …)
  timezone?: string | null;
}

export interface StudentVector {
  exam: string;
  deadline: string; // "1-2m" | "3-6m" | "flex"
  formats: string[]; // [] = без разницы
  languages: string[]; // коды kk/ru/en; [] = без разницы
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

// Код языка студента → как тьюторы пишут язык в профиле.
const LANG_PREFIX: Record<string, string[]> = {
  kk: ["казах", "қазақ"],
  ru: ["рус", "орыс"],
  en: ["англ", "ағылшын", "english"],
};

function langOverlap(tutorLangs: string[], studentCodes: string[]): boolean {
  const lower = tutorLangs.map((l) => l.toLowerCase());
  return studentCodes.some((code) =>
    (LANG_PREFIX[code] ?? []).some((p) => lower.some((l) => l.startsWith(p))),
  );
}

export function scoreTutor(t: TutorMatchInput, v: StudentVector): RankedTutor {
  const reasons: string[] = [];

  const examMatch = t.exams.includes(v.exam);
  if (examMatch) reasons.push(`готовит к ${v.exam}`);

  // Доверие = дельта, усаженная к нулю на малой выборке (risk-adjust).
  const shrunkDelta = t.delta * (t.sample / (t.sample + SHRINK_K));
  const deltaScore = saturate(shrunkDelta, 2);
  const sampleScore = saturate(t.sample, 100);
  const retentionScore = saturate(t.retention, 90);
  const passScore = saturate(t.passRate, 90);
  const ratingScore = saturate(t.rating, 5);
  const tzScore = tzCompatibility(t.timezone, v.timezone);

  // Формат: пусто = без разницы; гибрид закрывает и онлайн, и оффлайн.
  const formatScore =
    v.formats.length === 0 || t.format === "hybrid" || v.formats.includes(t.format) ? 1 : 0.35;
  // Язык: пусто = без разницы; иначе нужен пересек с языками тьютора.
  const langScore = v.languages.length === 0 || langOverlap(t.languages, v.languages) ? 1 : 0.4;

  if (t.aiVerified) reasons.push("результаты верифицированы");
  if (t.retention >= 70) reasons.push(`удержание ${t.retention}%`);
  if (t.sample >= 50) reasons.push(`выборка ${t.sample} учеников`);
  if (v.formats.length > 0 && formatScore === 1) reasons.push("удобный формат занятий");
  if (v.languages.length > 0 && langScore === 1) reasons.push("подходящий язык обучения");
  if (v.timezone && t.timezone && Math.abs(tzOffsetMinutes(t.timezone) - tzOffsetMinutes(v.timezone)) <= 120)
    reasons.push("удобный часовой пояс");

  // Срочный дедлайн → выше ценятся проверенные «сдают с первого раза».
  const urgencyWeight = v.deadline === "1-2m" ? 1.2 : 1;

  const trust = Math.min(
    1,
    0.22 * deltaScore +
      0.15 * retentionScore +
      0.11 * sampleScore +
      0.10 * passScore * urgencyWeight +
      0.10 * tzScore +
      0.07 * ratingScore +
      0.12 * formatScore +
      0.13 * langScore,
  );

  // Экзамен — жёсткий гейт. Совпавшие живут в диапазоне 52–99%
  // (компатибилити-шкала, не верифицированная метрика), несовпавшие — низко.
  const percent = examMatch ? Math.round(52 + 47 * trust) : Math.round(10 + 30 * trust);

  return { id: t.id, percent, reasons: reasons.slice(0, 3) };
}

export function rankTutors(tutors: TutorMatchInput[], v: StudentVector): RankedTutor[] {
  return tutors
    .map((t) => scoreTutor(t, v))
    .sort((a, b) => b.percent - a.percent);
}
