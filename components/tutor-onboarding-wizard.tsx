"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipSelect, Segmented, Slider, CitySelect, StepProgress } from "@/components/onboarding/inputs";
import {
  EXAM_OPTIONS, SPECIALIZATIONS, specsForExams, CITY_OPTIONS, PRICE, EXPERIENCE,
  MAX_EXAMS, MAX_SPECS_PER_EXAM, BIO_PLACEHOLDER, METHOD_PLACEHOLDER, type ChoiceOption,
} from "@/lib/onboarding-data";
import { cn } from "@/lib/utils";
import type { Dict } from "@/lib/i18n";

export interface TutorOnbInitial {
  exams: string[];
  subjects: string[];
  price: number;
  experience: number;
  format: string;
  city: string;
  bio: string;
  methodology: string;
  trialFree: boolean;
}

const STEPS = 5;

export function TutorOnboardingWizard({
  initial,
  nextHref,
  labels: L,
}: {
  initial?: TutorOnbInitial;
  nextHref: string;
  labels: Dict["tutorWizard"];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [exams, setExams] = useState<string[]>(initial?.exams ?? []);
  const [specsByExam, setSpecsByExam] = useState<Record<string, string[]>>(() => {
    const set = new Set(initial?.subjects ?? []);
    const out: Record<string, string[]> = {};
    for (const e of initial?.exams ?? []) out[e] = (SPECIALIZATIONS[e] ?? []).filter((s) => set.has(s));
    return out;
  });
  const [price, setPrice] = useState(initial?.price || PRICE.presets[2]);
  const [experience, setExperience] = useState(initial?.experience ?? 2);
  const [format, setFormat] = useState(initial?.format ?? "online");
  const [city, setCity] = useState(initial?.city ?? "Онлайн");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [methodology, setMethodology] = useState(initial?.methodology ?? "");
  const [trialFree, setTrialFree] = useState(initial?.trialFree ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const examOpts: ChoiceOption[] = EXAM_OPTIONS.map((e) => ({ value: e.value, label: e.value, emoji: e.emoji }));
  const cascade = specsForExams(exams);
  const specList = Array.from(new Set(exams.flatMap((e) => specsByExam[e] ?? [])));

  const canNext = step !== 0 || exams.length > 0;

  function next() {
    setError("");
    if (step === 0 && exams.length === 0) return setError(L.examsReq);
    if (step < STEPS - 1) setStep(step + 1);
    else save();
  }

  function setExamSelection(nextExams: string[]) {
    setExams(nextExams);
    // подчистим специализации снятых экзаменов
    setSpecsByExam((prev) => {
      const out: Record<string, string[]> = {};
      for (const e of nextExams) out[e] = prev[e] ?? [];
      return out;
    });
  }

  async function save() {
    setSaving(true);
    setError("");
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await fetch("/api/tutor/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exams, subjects: specList, price: String(price), experience: String(experience),
        format, city, bio, methodology, trialFree, timezone,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(data.error || L.saveError);
    router.push(nextHref);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl">
      <StepProgress step={step} total={STEPS} />
      <div className="mt-4 text-sm text-muted-foreground">{L.step} {step + 1} {L.of} {STEPS}</div>

      <div className="mt-1 min-h-[19rem]">
        {step === 0 && (
          <Section title={L.examsTitle} hint={L.examsHint}>
            <ChipSelect options={examOpts} selected={exams} onChange={setExamSelection} max={MAX_EXAMS} />
            <Counter n={exams.length} max={MAX_EXAMS} />
          </Section>
        )}

        {step === 1 && (
          <Section title={L.specsTitle} hint={L.specsHint}>
            {cascade.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">{L.specsEmpty}</p>
            ) : (
              <div className="space-y-5">
                {cascade.map(({ exam, options }) => (
                  <div key={exam}>
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <span>{EXAM_OPTIONS.find((e) => e.value === exam)?.emoji}</span>{exam}
                    </div>
                    <ChipSelect
                      size="sm"
                      options={options.map((o) => ({ value: o, label: o }))}
                      selected={specsByExam[exam] ?? []}
                      onChange={(sel) => setSpecsByExam((p) => ({ ...p, [exam]: sel }))}
                      max={MAX_SPECS_PER_EXAM}
                    />
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {step === 2 && (
          <Section title={L.moneyTitle} hint={L.moneyHint}>
            <div className="space-y-8">
              <div>
                <div className="mb-2 text-sm font-medium text-muted-foreground">{L.priceCap}</div>
                <Slider
                  min={PRICE.min} max={PRICE.max} step={PRICE.step} value={price} onChange={setPrice}
                  presets={PRICE.presets} format={(v) => `${v.toLocaleString("ru-RU")} ${L.perHour}`}
                />
              </div>
              <div>
                <div className="mb-2 text-sm font-medium text-muted-foreground">{L.expCap}</div>
                <Slider
                  min={EXPERIENCE.min} max={EXPERIENCE.max} step={EXPERIENCE.step} value={experience} onChange={setExperience}
                  presets={EXPERIENCE.presets}
                  format={(v) => (v >= EXPERIENCE.max ? L.yearsMax : `${v} ${L.years}`)}
                />
              </div>
            </div>
          </Section>
        )}

        {step === 3 && (
          <Section title={L.whereTitle} hint={L.whereHint}>
            <div className="space-y-6">
              <div>
                <div className="mb-2 text-sm font-medium text-muted-foreground">{L.formatCap}</div>
                <Segmented
                  value={format}
                  onChange={setFormat}
                  options={[
                    { value: "online", label: L.online, emoji: "💻" },
                    { value: "offline", label: L.offline, emoji: "🏢" },
                    { value: "hybrid", label: L.hybrid, emoji: "🔀" },
                  ]}
                />
              </div>
              <div>
                <div className="mb-2 text-sm font-medium text-muted-foreground">{L.cityCap}</div>
                <CitySelect cities={CITY_OPTIONS} value={city} onChange={setCity} />
              </div>
            </div>
          </Section>
        )}

        {step === 4 && (
          <Section title={L.aboutTitle} hint={L.aboutHint}>
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 text-sm font-medium text-muted-foreground">{L.bioCap}</div>
                <textarea
                  value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
                  placeholder={BIO_PLACEHOLDER}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <div className="mb-1.5 text-sm font-medium text-muted-foreground">{L.methodCap}</div>
                <textarea
                  value={methodology} onChange={(e) => setMethodology(e.target.value)} rows={3}
                  placeholder={METHOD_PLACEHOLDER}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm">
                <input type="checkbox" checked={trialFree} onChange={(e) => setTrialFree(e.target.checked)} />
                {L.trialCap}
              </label>
            </div>
          </Section>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || saving}>
          <ArrowLeft size={16} /> {L.back}
        </Button>
        <Button onClick={next} disabled={!canNext || saving}>
          {saving ? L.saving : step < STEPS - 1 ? L.next : L.saveProfile}
          {step < STEPS - 1 && <ArrowRight size={16} />}
        </Button>
      </div>

      {/* Точки шагов — свободная навигация (удобно при редактировании) */}
      <div className="mt-5 flex justify-center gap-2">
        {Array.from({ length: STEPS }).map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            disabled={saving}
            aria-label={`${L.step} ${i + 1}`}
            className={cn("h-2 w-2 rounded-full transition-colors", i === step ? "bg-primary" : "bg-muted hover:bg-primary/40")}
          />
        ))}
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="pt-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      {hint && <p className="mt-1 text-muted-foreground">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Counter({ n, max }: { n: number; max: number }) {
  return <div className="mt-3 text-xs text-muted-foreground">{n} / {max}</div>;
}
