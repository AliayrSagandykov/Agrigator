"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipSelect, BandPicker, StepProgress } from "@/components/onboarding/inputs";
import {
  EXAM_OPTIONS, EXAM_SCALES, defaultBand, formatBand,
  CADENCE_OPTIONS, HORIZON_OPTIONS, LEVEL_OPTIONS, APPROACH_OPTIONS, MAX_APPROACH,
  type Band, type MatchPrefs,
} from "@/lib/onboarding-data";
import type { Dict } from "@/lib/i18n";

const STEPS = 3;

export function TutorMatchWizard({
  exams,
  initialBands,
  initialPrefs,
  labels: L,
}: {
  exams: string[];
  initialBands?: Record<string, Band>;
  initialPrefs?: MatchPrefs;
  labels: Dict["tutorWizard"];
}) {
  const router = useRouter();
  const bandable = exams.filter((e) => EXAM_SCALES[e]);
  const [step, setStep] = useState(0);
  const [bands, setBands] = useState<Record<string, Band>>(() => {
    const out: Record<string, Band> = {};
    for (const e of bandable) out[e] = initialBands?.[e] ?? defaultBand(e);
    return out;
  });
  const [prefs, setPrefs] = useState<MatchPrefs>({
    cadence: initialPrefs?.cadence ?? [],
    horizon: initialPrefs?.horizon ?? [],
    levels: initialPrefs?.levels ?? [],
    approach: initialPrefs?.approach ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const setPref = (k: keyof MatchPrefs) => (v: string[]) => setPrefs((p) => ({ ...p, [k]: v }));

  function next() {
    if (step < STEPS - 1) setStep(step + 1);
    else save();
  }

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/tutor/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bands, prefs }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(data.error || L.saveError);
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <div className="text-5xl">🎯</div>
        <h1 className="mt-3 text-2xl font-bold">{L.doneTitle}</h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">{L.doneBody}</p>
        <div className="mx-auto mt-5 flex max-w-md flex-wrap justify-center gap-2">
          {bandable.map((e) => (
            <span key={e} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium">
              {EXAM_OPTIONS.find((x) => x.value === e)?.emoji} {e} {formatBand(e, bands[e])}
            </span>
          ))}
        </div>
        <Link href="/tutor" className="mt-6 inline-block">
          <Button>{L.toDashboard}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <StepProgress step={step} total={STEPS} />
      <div className="mt-4 text-sm text-muted-foreground">{L.step} {step + 1} {L.of} {STEPS}</div>

      <div className="mt-1 min-h-[20rem]">
        {step === 0 && (
          <Section title={L.bandsTitle} hint={L.bandsHint}>
            {bandable.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">{L.bandsEmpty}</p>
            ) : (
              <div className="space-y-6">
                {bandable.map((e) => (
                  <div key={e} className="rounded-xl border border-border p-4">
                    <div className="mb-3 flex items-center gap-2 font-semibold">
                      <span>{EXAM_OPTIONS.find((x) => x.value === e)?.emoji}</span>{e}
                    </div>
                    <BandPicker exam={e} band={bands[e]} onChange={(b) => setBands((prev) => ({ ...prev, [e]: b }))} />
                  </div>
                ))}
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Sparkles size={14} className="mt-0.5 shrink-0 text-primary" />{L.bandHelp}
                </p>
              </div>
            )}
          </Section>
        )}

        {step === 1 && (
          <Section title={L.cadenceTitle} hint={L.cadenceHint}>
            <div className="space-y-7">
              <div>
                <div className="mb-2 text-sm font-medium text-muted-foreground">{L.cadenceCap}</div>
                <ChipSelect options={CADENCE_OPTIONS} selected={prefs.cadence} onChange={setPref("cadence")} />
              </div>
              <div>
                <div className="mb-2 text-sm font-medium text-muted-foreground">{L.horizonCap}</div>
                <ChipSelect options={HORIZON_OPTIONS} selected={prefs.horizon} onChange={setPref("horizon")} />
              </div>
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section title={L.approachTitle} hint={L.approachHint}>
            <div className="space-y-7">
              <div>
                <div className="mb-2 text-sm font-medium text-muted-foreground">{L.levelsCap}</div>
                <ChipSelect options={LEVEL_OPTIONS} selected={prefs.levels} onChange={setPref("levels")} />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{L.approachCap}</span>
                  <span className="text-xs text-muted-foreground">{prefs.approach.length} / {MAX_APPROACH}</span>
                </div>
                <ChipSelect options={APPROACH_OPTIONS} selected={prefs.approach} onChange={setPref("approach")} max={MAX_APPROACH} />
              </div>
            </div>
          </Section>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || saving}>
          <ArrowLeft size={16} /> {L.back}
        </Button>
        <Button onClick={next} disabled={saving}>
          {saving ? L.saving : step < STEPS - 1 ? L.next : L.finishTest}
          {step < STEPS - 1 && <ArrowRight size={16} />}
        </Button>
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
