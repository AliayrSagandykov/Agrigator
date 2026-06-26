// ============================================================
// Таксономия онбординга тютора и матчмейкинга. Чистые данные + хелперы,
// без server-only — импортируется и на клиенте (визарды), и на сервере (матч).
//
// Принцип: тютор НЕ печатает руками. Экзамены и специализации — выбор из
// выборки; специализации каскадно зависят от выбранных экзаменов. Бэнды
// «кому могу помогать» — диапазон по шкале экзамена (radius для матча).
// ============================================================

export const MAX_EXAMS = 4;
export const MAX_SPECS_PER_EXAM = 4;
export const MAX_APPROACH = 3;

// ── Экзамены (выбор тютора) ────────────────────────────────
export interface ExamOption {
  value: string;
  emoji: string;
  group: string; // для группировки в UI
}

export const EXAM_OPTIONS: ExamOption[] = [
  { value: "IELTS", emoji: "🇬🇧", group: "Английский" },
  { value: "TOEFL", emoji: "🗽", group: "Английский" },
  { value: "Duolingo", emoji: "🦉", group: "Английский" },
  { value: "SAT", emoji: "🎓", group: "US / UK" },
  { value: "ACT", emoji: "📘", group: "US / UK" },
  { value: "AP", emoji: "🏛️", group: "US / UK" },
  { value: "A-Level", emoji: "📗", group: "US / UK" },
  { value: "IB", emoji: "🌍", group: "US / UK" },
  { value: "GMAT", emoji: "💼", group: "Магистратура" },
  { value: "GRE", emoji: "📊", group: "Магистратура" },
  { value: "ЕНТ", emoji: "🇰🇿", group: "Казахстан" },
  { value: "НМТ", emoji: "🇰🇿", group: "Казахстан" },
  { value: "NUET", emoji: "🏫", group: "Казахстан" },
];

export const EXAM_VALUES = EXAM_OPTIONS.map((e) => e.value);

// ── Специализации (каскад от экзамена) ─────────────────────
// Тютор выбирает до 4 на каждый выбранный экзамен.
export const SPECIALIZATIONS: Record<string, string[]> = {
  IELTS: ["Listening", "Reading", "Writing", "Speaking", "Academic", "General"],
  TOEFL: ["Listening", "Reading", "Writing", "Speaking"],
  Duolingo: ["Literacy", "Comprehension", "Conversation", "Production"],
  SAT: ["Math", "Reading & Writing", "Digital SAT"],
  ACT: ["English", "Math", "Reading", "Science"],
  AP: ["Calculus", "Physics", "Chemistry", "Biology", "Statistics", "Computer Science", "Economics", "English"],
  "A-Level": ["Mathematics", "Further Maths", "Physics", "Chemistry", "Biology", "Economics", "Computer Science", "Business"],
  IB: ["Math AA", "Math AI", "Physics", "Chemistry", "Biology", "Economics", "English", "Business"],
  GMAT: ["Quant", "Verbal", "Data Insights"],
  GRE: ["Quant", "Verbal", "Analytical Writing"],
  ЕНТ: ["Математика", "Физика", "Химия", "Биология", "География", "Информатика", "Всемирная история", "Английский язык"],
  НМТ: ["Мат. грамотность", "Грамотность чтения", "История Казахстана", "Математика", "Физика", "Химия", "Биология", "Информатика"],
  NUET: ["Critical Thinking", "Mathematics", "Problem Solving"],
};

export function specsForExams(exams: string[]): { exam: string; options: string[] }[] {
  return exams
    .filter((e) => SPECIALIZATIONS[e]?.length)
    .map((e) => ({ exam: e, options: SPECIALIZATIONS[e] }));
}

// ── Шкалы экзаменов (для бэндов «кому помогаю») ────────────
export type ExamScale =
  | { kind: "numeric"; min: number; max: number; step: number; unit?: string }
  | { kind: "ordinal"; grades: string[] };

export const EXAM_SCALES: Record<string, ExamScale> = {
  IELTS: { kind: "numeric", min: 4, max: 9, step: 0.5 },
  TOEFL: { kind: "numeric", min: 30, max: 120, step: 1 },
  Duolingo: { kind: "numeric", min: 60, max: 160, step: 5 },
  SAT: { kind: "numeric", min: 800, max: 1600, step: 10 },
  ACT: { kind: "numeric", min: 12, max: 36, step: 1 },
  GMAT: { kind: "numeric", min: 400, max: 800, step: 10 },
  GRE: { kind: "numeric", min: 280, max: 340, step: 1 },
  ЕНТ: { kind: "numeric", min: 50, max: 140, step: 5 },
  НМТ: { kind: "numeric", min: 100, max: 200, step: 5 },
  NUET: { kind: "numeric", min: 60, max: 240, step: 10 },
  AP: { kind: "ordinal", grades: ["1", "2", "3", "4", "5"] },
  IB: { kind: "ordinal", grades: ["3", "4", "5", "6", "7"] },
  "A-Level": { kind: "ordinal", grades: ["E", "D", "C", "B", "A", "A*"] },
};

export interface Band {
  from: number | string;
  to: number | string;
}

/** Разумный дефолтный бэнд — верхне-средняя зона шкалы (где обычно «добивают»). */
export function defaultBand(exam: string): Band {
  const s = EXAM_SCALES[exam];
  if (!s) return { from: 0, to: 0 };
  if (s.kind === "numeric") {
    const span = s.max - s.min;
    const from = roundToStep(s.min + span * 0.45, s);
    const to = roundToStep(s.min + span * 0.8, s);
    return { from, to };
  }
  const n = s.grades.length;
  return { from: s.grades[Math.max(0, n - 3)], to: s.grades[n - 1] };
}

function roundToStep(v: number, s: Extract<ExamScale, { kind: "numeric" }>): number {
  return Math.round(v / s.step) * s.step;
}

/** Позиция значения на шкале в 0..1 (для матча и сравнения бэндов). */
export function normalizeLevel(exam: string, value: number | string): number {
  const s = EXAM_SCALES[exam];
  if (!s) return 0.5;
  if (s.kind === "numeric") {
    const v = typeof value === "number" ? value : parseFloat(String(value));
    if (!Number.isFinite(v)) return 0.5;
    return clamp01((v - s.min) / (s.max - s.min));
  }
  const idx = s.grades.indexOf(String(value));
  if (idx < 0) return 0.5;
  return s.grades.length > 1 ? idx / (s.grades.length - 1) : 0.5;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function formatBand(exam: string, band: Band): string {
  return `${band.from}–${band.to}`;
}

// ── Города (KZ + Онлайн) ───────────────────────────────────
export const CITY_OPTIONS = [
  "Онлайн", "Алматы", "Астана", "Шымкент", "Караганда", "Актобе", "Тараз",
  "Павлодар", "Өскемен", "Семей", "Атырау", "Костанай", "Кызылорда",
  "Уральск", "Петропавловск", "Актау", "Туркестан", "Темиртау",
  "Кокшетау", "Талдыкорган", "Экибастуз", "Рудный",
] as const;

// ── Цена и опыт (слайдеры + пресеты) ───────────────────────
export const PRICE = { min: 2000, max: 50000, step: 500, presets: [5000, 8000, 12000, 18000, 25000] };
export const EXPERIENCE = { min: 0, max: 30, step: 1, presets: [1, 2, 3, 5, 10] };

// ── Параметры матча тютора (тест после профиля) ────────────
export interface ChoiceOption {
  value: string;
  label: string;
  emoji?: string;
}

// Каденс: сколько раз в неделю тютор готов вести (мульти).
export const CADENCE_OPTIONS: ChoiceOption[] = [
  { value: "1", label: "1 раз", emoji: "🟢" },
  { value: "2", label: "2 раза", emoji: "🔵" },
  { value: "3", label: "3 раза", emoji: "🟣" },
  { value: "4+", label: "4+ раз", emoji: "🔥" },
];

// Горизонт подготовки, с которым работает (мульти).
export const HORIZON_OPTIONS: ChoiceOption[] = [
  { value: "sprint", label: "Спринт · 1–2 мес", emoji: "⚡" },
  { value: "standard", label: "Стандарт · 3–6 мес", emoji: "📅" },
  { value: "long", label: "Вдолгую · 6+ мес", emoji: "🌱" },
];

// Уровень студентов, которых берёт (мульти).
export const LEVEL_OPTIONS: ChoiceOption[] = [
  { value: "beginner", label: "С нуля / начинающие", emoji: "🌱" },
  { value: "intermediate", label: "Средний уровень", emoji: "📈" },
  { value: "advanced", label: "Добить топ-балл", emoji: "🚀" },
];

// Подход к обучению (мульти, до 3).
export const APPROACH_OPTIONS: ChoiceOption[] = [
  { value: "structured", label: "Жёсткая структура и дедлайны", emoji: "🧱" },
  { value: "supportive", label: "Мягко, через мотивацию", emoji: "🤝" },
  { value: "exam_hacks", label: "Экзам-стратегии и лайфхаки", emoji: "🎯" },
  { value: "fundamentals", label: "Фундамент и глубина", emoji: "🏛️" },
  { value: "practice", label: "Много практики на реальных заданиях", emoji: "✍️" },
  { value: "personalized", label: "Индивидуальный план под пробелы", emoji: "🧩" },
];

export interface MatchPrefs {
  cadence: string[];
  horizon: string[];
  levels: string[];
  approach: string[];
}

export const EMPTY_PREFS: MatchPrefs = { cadence: [], horizon: [], levels: [], approach: [] };

// ── Примеры-плейсхолдеры для «о себе» и методики ────────────
export const BIO_PLACEHOLDER =
  "Например: Готовлю к IELTS 5 лет, мой балл — 8.5. Специализируюсь на Writing и Speaking. " +
  "За курс поднимаю в среднем на 1.0–1.5 балла. Люблю разбирать реальные эссе студента построчно.";

export const METHOD_PLACEHOLDER =
  "Например: Магистр лингвистики (Назарбаев Университет). Сначала диагностика слабых мест, " +
  "потом персональный план: 70% практики на банке заданий + еженедельные мок-тесты с разбором.";
