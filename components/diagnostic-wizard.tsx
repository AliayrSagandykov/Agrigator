"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Question {
  prompt: string;
  options: string[];
}
interface Result {
  correct: number;
  total: number;
  baseline: number;
}

export function DiagnosticWizard({ exam, questions }: { exam: string; questions: Question[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const progress = Math.round((step / questions.length) * 100);

  async function choose(optionIndex: number) {
    const next = [...answers];
    next[step] = optionIndex;
    setAnswers(next);

    if (step < questions.length - 1) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/diagnostic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: next }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setResult(data);
      router.refresh();
    }
  }

  if (result) {
    return (
      <Card>
        <CardContent className="text-center">
          <div className="text-5xl">🎯</div>
          <h2 className="mt-3 text-xl font-bold">Готово!</h2>
          <p className="mt-1 text-muted-foreground">
            Верно {result.correct} из {result.total}.
          </p>
          <div className="mt-4 inline-block rounded-xl bg-accent px-6 py-4">
            <div className="text-sm text-accent-foreground/80">Твой baseline по {exam}</div>
            <div className="text-3xl font-bold text-accent-foreground">{result.baseline}</div>
          </div>
          <p className="mx-auto mt-4 max-w-sm text-sm text-muted-foreground">
            Теперь, когда сдашь экзамен и загрузишь результат, система сама посчитает дельту.
          </p>
          <Link href="/dashboard" className="mt-5 inline-block">
            <Button>В кабинет</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const q = questions[step];

  return (
    <div>
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(progress, 6)}%` }} />
      </div>
      <div className="text-sm text-muted-foreground">
        Вопрос {step + 1} из {questions.length} · {exam}
      </div>
      <h1 className="mt-1 text-xl font-bold">{q.prompt}</h1>

      <div className="mt-5 space-y-3">
        {q.options.map((opt, i) => (
          <button
            key={i}
            disabled={loading}
            onClick={() => choose(i)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left font-medium transition-all hover:border-primary hover:bg-accent disabled:opacity-50",
            )}
          >
            {opt}
            <span className="text-muted-foreground">→</span>
          </button>
        ))}
      </div>

      {step > 0 && (
        <Button variant="ghost" className="mt-4" onClick={() => setStep(step - 1)} disabled={loading}>
          ← Назад
        </Button>
      )}
    </div>
  );
}
