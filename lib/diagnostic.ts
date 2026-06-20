import "server-only";

// ============================================================
// Диагностика-мок (UX §2.2): короткий тест внутри платформы → baseline.
// Правильные ответы (correct) живут ТОЛЬКО на сервере — клиенту уходят
// лишь prompt+options. Оценивание тоже на сервере (анти-чит).
// ============================================================

interface DQuestion {
  prompt: string;
  options: string[];
  correct: number; // индекс правильного варианта
}

const BANK: Record<string, DQuestion[]> = {
  SAT: [
    { prompt: "Если 3x + 5 = 20, то x = ?", options: ["3", "5", "7", "15"], correct: 1 },
    { prompt: "15% от 80 — это…", options: ["10", "12", "15", "8"], correct: 1 },
    { prompt: "Наклон прямой через (0,1) и (2,5):", options: ["1", "2", "3", "4"], correct: 1 },
    { prompt: "Neither of the boys ___ ready.", options: ["are", "were", "is", "have"], correct: 2 },
    { prompt: "Если a=2, b=3, то a² + b² = ?", options: ["10", "12", "13", "25"], correct: 2 },
  ],
  IELTS: [
    { prompt: "Synonym of “significant”:", options: ["tiny", "important", "fast", "blue"], correct: 1 },
    { prompt: "She has lived here ___ 2010.", options: ["since", "for", "from", "at"], correct: 0 },
    { prompt: "Antonym of “scarce”:", options: ["rare", "abundant", "hidden", "quiet"], correct: 1 },
    { prompt: "If I ___ rich, I would travel.", options: ["am", "was", "were", "will be"], correct: 2 },
    { prompt: "He suggested ___ early.", options: ["to leave", "leaving", "leave", "left"], correct: 1 },
  ],
  "ЕНТ": [
    { prompt: "Решите: 2x − 6 = 10, x = ?", options: ["2", "8", "6", "16"], correct: 1 },
    { prompt: "25% от 200 = ?", options: ["25", "40", "50", "75"], correct: 2 },
    { prompt: "Площадь прямоугольника 4×6 = ?", options: ["10", "24", "20", "12"], correct: 1 },
    { prompt: "Чему равно 3! (факториал)?", options: ["3", "6", "9", "1"], correct: 1 },
    { prompt: "Следующее число: 2, 4, 8, 16, ?", options: ["24", "32", "20", "18"], correct: 1 },
  ],
  "НМТ": [
    { prompt: "Все А — В, все В — С. Значит, все А — …", options: ["не С", "С", "только В", "нельзя сказать"], correct: 1 },
    { prompt: "7 × 8 = ?", options: ["54", "56", "64", "49"], correct: 1 },
    { prompt: "Продолжи ряд: 1, 1, 2, 3, 5, ?", options: ["6", "7", "8", "9"], correct: 2 },
    { prompt: "Среднее чисел 4, 8, 12 = ?", options: ["6", "8", "10", "12"], correct: 1 },
    { prompt: "Сколько граней у куба?", options: ["4", "6", "8", "12"], correct: 1 },
  ],
};

// Шкала экзамена: [min, max, step] для перевода % верных в baseline-балл.
const SCALES: Record<string, [number, number, number]> = {
  SAT: [400, 1600, 10],
  IELTS: [3, 9, 0.5],
  "ЕНТ": [0, 140, 1],
  "НМТ": [100, 200, 1],
};

export interface ClientQuestion {
  prompt: string;
  options: string[];
}

export function isExamSupported(exam: string): boolean {
  return exam in BANK;
}

/** Вопросы для клиента — без правильных ответов. */
export function getClientQuestions(exam: string): ClientQuestion[] | null {
  const bank = BANK[exam];
  if (!bank) return null;
  return bank.map((q) => ({ prompt: q.prompt, options: q.options }));
}

export interface DiagnosticResult {
  correct: number;
  total: number;
  baseline: number;
}

export function scoreAnswers(exam: string, answers: number[]): DiagnosticResult | null {
  const bank = BANK[exam];
  const scale = SCALES[exam];
  if (!bank || !scale) return null;

  let correct = 0;
  bank.forEach((q, i) => {
    if (answers[i] === q.correct) correct++;
  });
  const pct = correct / bank.length;

  const [min, max, step] = scale;
  const baseline = Math.round((min + pct * (max - min)) / step) * step;

  return { correct, total: bank.length, baseline };
}
