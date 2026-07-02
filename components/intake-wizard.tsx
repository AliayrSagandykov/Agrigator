"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { INTAKE_STEPS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import type { Dict } from "@/lib/i18n";

// Интейк студента (UX §2.1): по одному вопросу на экран, Apple-минимализм.
// radio-шаг — тап сразу ведёт дальше; multi-шаг (checkbox) — выбор + «Далее».
// «Без разницы» (any) взаимоисключим с остальными вариантами.
export function IntakeWizard({ labels }: { labels: Dict["intake"] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null); // подсветка выбора перед переходом

  const current = INTAKE_STEPS[step];
  const stepText = labels.steps[current.key];
  const progress = Math.round(((step + 1) / INTAKE_STEPS.length) * 100);
  const selected = answers[current.key];
  const multiSelected: string[] = Array.isArray(selected) ? selected : [];

  // Подпись опции: экзамены не переводим (значение = подпись), остальное из словаря.
  const optionLabel = (value: string): string => {
    if (current.key === "exam") return value;
    const opts = (stepText as { opts?: Record<string, string> }).opts;
    return opts?.[value] ?? value;
  };

  async function finish(final: Record<string, string | string[]>) {
    setSaving(true);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam: final.exam,
        deadline: final.deadline,
        pace: final.pace,
        style: final.style,
        formats: final.format ?? [],
        languages: final.language ?? [],
        timezone,
      }),
    });
    router.push("/match");
    router.refresh();
  }

  function advance(next: Record<string, string | string[]>) {
    if (step < INTAKE_STEPS.length - 1) {
      setStep(step + 1);
      setFlash(null);
    } else {
      void finish(next);
    }
  }

  // Radio: показываем выбор на мгновение (Apple-фидбек), затем переход.
  function chooseSingle(value: string) {
    if (saving || flash) return;
    const next = { ...answers, [current.key]: value };
    setAnswers(next);
    setFlash(value);
    setTimeout(() => advance(next), 240);
  }

  // Checkbox: тоггл; «any» сбрасывает остальные и наоборот.
  // Функциональный setState — быстрые последовательные тапы не теряют выбор.
  function toggleMulti(value: string) {
    if (saving) return;
    setAnswers((prev) => {
      const cur = prev[current.key];
      let list = Array.isArray(cur) ? [...cur] : [];
      if (value === "any") {
        list = list.includes("any") ? [] : ["any"];
      } else {
        list = list.filter((v) => v !== "any");
        list = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      }
      return { ...prev, [current.key]: list };
    });
  }

  function continueMulti() {
    if (multiSelected.length === 0) return;
    advance({ ...answers });
  }

  const isPicked = (value: string) =>
    current.multi ? multiSelected.includes(value) : (flash ?? selected) === value;

  return (
    <div className="mx-auto max-w-lg">
      {/* Тонкий прогресс — Apple-style */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* key={step} перезапускает анимацию появления на каждом шаге */}
      <div key={step} className="rise">
        <div className="mt-8 text-sm font-medium text-muted-foreground">
          {labels.stepPre} {step + 1} {labels.of} {INTAKE_STEPS.length}
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{stepText.title}</h1>
        {stepText.hint && <p className="mt-2 text-muted-foreground">{stepText.hint}</p>}

        <div
          className={cn(
            "mt-8 gap-2.5",
            current.key === "exam" ? "grid grid-cols-2 sm:grid-cols-3" : "flex flex-col",
          )}
        >
          {current.options.map((value) => {
            const picked = isPicked(value);
            return (
              <button
                key={value}
                type="button"
                disabled={saving}
                aria-pressed={picked}
                onClick={() => (current.multi ? toggleMulti(value) : chooseSingle(value))}
                className={cn(
                  "flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3.5 text-left font-medium transition-all duration-200 disabled:opacity-50",
                  picked
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                <span className={cn("text-[15px] leading-snug", picked && "text-primary")}>
                  {optionLabel(value)}
                </span>
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center border transition-all duration-200",
                    current.multi ? "rounded-md" : "rounded-full",
                    picked ? "border-primary bg-primary text-white" : "border-border bg-background",
                  )}
                >
                  {picked && <Check size={13} strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>

        {/* Multi-шаг: явная кнопка «Далее» */}
        {current.multi && (
          <Button
            size="lg"
            className="mt-6 w-full cursor-pointer rounded-xl"
            disabled={saving || multiSelected.length === 0}
            onClick={continueMulti}
          >
            {labels.next}
          </Button>
        )}
      </div>

      {step > 0 && (
        <Button
          variant="ghost"
          className="mt-4 cursor-pointer text-muted-foreground"
          onClick={() => {
            setFlash(null);
            setStep(step - 1);
          }}
          disabled={saving}
        >
          <ChevronLeft size={16} /> {labels.back}
        </Button>
      )}
    </div>
  );
}
