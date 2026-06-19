"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { INTAKE_STEPS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

// Интейк студента (UX §2.1): 4 вопроса, по одному на экран, крупные кнопки,
// без полей ввода. Сохраняется как матч-вектор.
export function IntakeWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const current = INTAKE_STEPS[step];
  const progress = Math.round((step / INTAKE_STEPS.length) * 100);

  async function choose(value: string) {
    const next = { ...answers, [current.key]: value };
    setAnswers(next);

    if (step < INTAKE_STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    // Последний шаг → сохраняем вектор и ведём на матч.
    setSaving(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    router.push("/match");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(progress, 6)}%` }} />
      </div>

      <div className="text-sm text-muted-foreground">
        Шаг {step + 1} из {INTAKE_STEPS.length}
      </div>
      <h1 className="mt-1 text-2xl font-bold">{current.title}</h1>
      {current.hint && <p className="mt-1 text-muted-foreground">{current.hint}</p>}

      <div className="mt-6 space-y-3">
        {current.options.map((opt) => (
          <button
            key={opt.value}
            disabled={saving}
            onClick={() => choose(opt.value)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left text-lg font-medium transition-all hover:border-primary hover:bg-accent disabled:opacity-50",
            )}
          >
            {opt.label}
            <span className="text-muted-foreground">→</span>
          </button>
        ))}
      </div>

      {step > 0 && (
        <Button variant="ghost" className="mt-4" onClick={() => setStep(step - 1)} disabled={saving}>
          ← Назад
        </Button>
      )}
    </div>
  );
}
