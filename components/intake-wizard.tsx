"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipSelect, LevelPicker, StepProgress } from "@/components/onboarding/inputs";
import {
  EXAM_OPTIONS, TIMELINE_OPTIONS, STUDENT_CADENCE_OPTIONS, STUDENT_APPROACH_OPTIONS,
  MAX_STUDENT_APPROACH, studentDefaults, EXAM_SCALES, type ChoiceOption,
} from "@/lib/onboarding-data";
import { cn } from "@/lib/utils";
import type { Dict } from "@/lib/i18n";

// Интейк студента — симметрично матч-тесту тютора: цель, стартовый уровень,
// сроки, частота, подход. Выбор вместо ввода; одиночные шаги авто-переходят.
const STEPS = 6;

// Уже сохранённые ответы — чтобы интейк ПОМНИЛ выбор, а не начинался с нуля.
export interface IntakeInitial {
  exam: string;
  startScore: string | null;
  targetScore: string | null;
  deadline: string;
  cadence: string | null;
  approach: string[];
}

export function IntakeWizard({ initial, labels: L }: { initial?: IntakeInitial; labels: Dict["intake"] }) {
  const router = useRouter();
  const d = initial?.exam ? studentDefaults(initial.exam) : { start: "", target: "" };
  const [step, setStep] = useState(0);
  const [exam, setExam] = useState(initial?.exam ?? "");
  const [startLevel, setStartLevel] = useState<number | string>(initial?.startScore ?? d.start);
  const [startKnown, setStartKnown] = useState(initial ? initial.startScore != null : true);
  const [target, setTarget] = useState<number | string>(initial?.targetScore ?? d.target);
  const [timeline, setTimeline] = useState(initial?.deadline ?? "");
  const [cadence, setCadence] = useState(initial?.cadence ?? "");
  const [approach, setApproach] = useState<string[]>(initial?.approach ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const examOpts: ChoiceOption[] = EXAM_OPTIONS.map((e) => ({ value: e.value, label: e.value, emoji: e.emoji }));
  const hasScale = !!EXAM_SCALES[exam];

  function pickExam(v: string) {
    setExam(v);
    const d = studentDefaults(v);
    setStartLevel(d.start);
    setTarget(d.target);
    setStartKnown(true);
    setStep(1);
  }

  const go = (d: number) => setStep((s) => Math.max(0, Math.min(STEPS - 1, s + d)));
  const advance = () => step < STEPS - 1 && setStep(step + 1);

  async function save() {
    setSaving(true);
    setError("");
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam,
        deadline: timeline || "flex",
        startScore: startKnown ? String(startLevel) : "",
        targetScore: String(target),
        cadence,
        approach,
        timezone,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setError(d.error || L.saveError);
    }
    router.push("/match");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg">
      <StepProgress step={step} total={STEPS} />
      <div className="mt-4 text-sm text-muted-foreground">{L.stepPre} {step + 1} {L.of} {STEPS}</div>

      <div className="mt-1 min-h-[17rem]">
        {step === 0 && (
          <Section title={L.steps.exam.title} hint={L.steps.exam.hint}>
            <ChipSelect single options={examOpts} selected={exam ? [exam] : []} onChange={(s) => pickExam(s[0] ?? "")} />
          </Section>
        )}

        {step === 1 && (
          <Section title={L.startTitle} hint={L.startHint}>
            {hasScale && <LevelPicker exam={exam} value={startLevel} onChange={setStartLevel} />}
          </Section>
        )}

        {step === 2 && (
          <Section title={L.targetTitle} hint={L.targetHint}>
            {hasScale && <LevelPicker exam={exam} value={target} onChange={setTarget} />}
            <div className="mt-4 flex justify-center gap-4 text-sm">
              <span className="text-muted-foreground">{L.current}: <b className="text-foreground">{startKnown ? startLevel : "—"}</b></span>
              <span className="text-primary">→</span>
              <span className="text-muted-foreground">{L.target}: <b className="text-foreground">{target}</b></span>
            </div>
          </Section>
        )}

        {step === 3 && (
          <Section title={L.whenTitle} hint={L.whenHint}>
            <ChipSelect single options={TIMELINE_OPTIONS} selected={timeline ? [timeline] : []}
              onChange={(s) => { setTimeline(s[0] ?? ""); if (s[0]) advance(); }} />
          </Section>
        )}

        {step === 4 && (
          <Section title={L.cadenceTitle} hint={L.cadenceHint}>
            <ChipSelect single options={STUDENT_CADENCE_OPTIONS} selected={cadence ? [cadence] : []}
              onChange={(s) => { setCadence(s[0] ?? ""); if (s[0]) advance(); }} />
          </Section>
        )}

        {step === 5 && (
          <Section title={L.approachTitle} hint={L.approachHint}>
            <ChipSelect options={STUDENT_APPROACH_OPTIONS} selected={approach} onChange={setApproach} max={MAX_STUDENT_APPROACH} />
            <div className="mt-3 text-xs text-muted-foreground">{approach.length} / {MAX_STUDENT_APPROACH}</div>
          </Section>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-6 flex items-center justify-between">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => go(-1)} disabled={saving}><ArrowLeft size={16} /> {L.back}</Button>
        ) : <span />}
        <div className="flex gap-2">
          {step === 1 && (
            <Button variant="ghost" onClick={() => { setStartKnown(false); setStep(2); }} disabled={saving}>{L.startSkip}</Button>
          )}
          {(step === 1 || step === 2) && (
            <Button onClick={advance}>{L.next} <ArrowRight size={16} /></Button>
          )}
          {step === 5 && (
            <Button onClick={save} disabled={saving}>{saving ? L.saving : L.finish}</Button>
          )}
        </div>
      </div>

      <div className="mt-5 flex justify-center gap-2">
        {Array.from({ length: STEPS }).map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            disabled={saving || (i > 0 && !exam)}
            aria-label={`${L.stepPre} ${i + 1}`}
            className={cn("h-2 w-2 rounded-full transition-colors disabled:opacity-40", i === step ? "bg-primary" : "bg-muted hover:bg-primary/40")}
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
