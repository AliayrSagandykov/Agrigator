// ============================================================
// Доменные константы и тексты онбординга/интейка.
// Узкий вход (из UX-спека): тест-преп, где результат проверяется извне.
// ============================================================

export const PRIMARY_EXAMS = ["SAT", "IELTS", "НМТ", "ЕНТ"] as const;

// Полный список экзаменов агрегатора (каталог шире, чем интейк-фокус).
// GMAT/GRE/ACT убраны — непопулярны на казахстанском рынке (фокус региона).
export const ALL_EXAMS = [
  "IELTS", "TOEFL", "SAT", "IB", "A-Level", "AP", "ЕНТ", "НМТ", "NUET",
] as const;

export const CITIES = ["Онлайн", "Алматы", "Астана", "Шымкент"] as const;

export const FORMATS = [
  { value: "online", label: "Онлайн" },
  { value: "offline", label: "Оффлайн" },
  { value: "hybrid", label: "Гибрид" },
] as const;

// ── Интейк студента: по одному вопросу на экран (UX §2.1).
// multi = checkbox-шаг (несколько ответов); "any" = «без разницы»
// (выбор any сбрасывает остальные и наоборот). Тексты — в i18n intake.steps.
export type IntakeStepKey = "exam" | "deadline" | "format" | "language" | "pace" | "style";

export interface IntakeStep {
  key: IntakeStepKey;
  multi: boolean;
  options: readonly string[];
}

export const INTAKE_STEPS: readonly IntakeStep[] = [
  { key: "exam", multi: false, options: ALL_EXAMS },
  { key: "deadline", multi: false, options: ["1-2m", "3-6m", "flex"] },
  { key: "format", multi: true, options: ["online", "offline", "hybrid", "any"] },
  { key: "language", multi: true, options: ["kk", "ru", "en", "any"] },
  { key: "pace", multi: false, options: ["slow", "fast", "any"] },
  { key: "style", multi: false, options: ["strict", "soft", "any"] },
];

export const DEADLINE_LABEL: Record<string, string> = {
  "1-2m": "через 1–2 мес",
  "3-6m": "через 3–6 мес",
  flex: "без спешки",
};

export const PACE_LABEL: Record<string, string> = {
  slow: "основательный темп",
  fast: "интенсивный темп",
};

export const STYLE_LABEL: Record<string, string> = {
  strict: "строгий стиль",
  soft: "мягкий стиль",
};

// ── Ретеншн-микровопрос (UX §2.10) ──
export const RETENTION_REASONS = [
  { value: "pause", label: "Да, просто пауза" },
  { value: "goal_reached", label: "Цель достигнута" },
  { value: "not_fit", label: "Не подошёл" },
  { value: "expensive", label: "Дорого" },
] as const;

export const RETENTION_REASON_LABEL: Record<string, string> = {
  pause: "пауза",
  goal_reached: "цель достигнута",
  not_fit: "не подошёл",
  expensive: "дорого",
};

// Палитра цветов аватара пользователя (выбор в настройках аккаунта).
export const AVATAR_COLORS = [
  "#7c3aed", "#0ea5e9", "#16a34a", "#f59e0b", "#ef4444",
  "#ec4899", "#14b8a6", "#6366f1", "#f97316", "#8b5cf6",
] as const;

// Градиенты карточек (повторяют легаси-палитру).
export const GRADIENTS: Record<string, string> = {
  g1: "from-indigo-500 to-violet-500",
  g2: "from-sky-500 to-cyan-500",
  g3: "from-emerald-500 to-teal-500",
  g4: "from-amber-500 to-orange-500",
  g5: "from-rose-500 to-pink-500",
  g6: "from-fuchsia-500 to-purple-500",
};
