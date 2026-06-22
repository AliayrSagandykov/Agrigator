"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { Dict } from "@/lib/i18n";

export interface TutorProfileInitial {
  subjects?: string;
  exams?: string;
  price?: number;
  format?: string;
  city?: string;
  experience?: number;
  bio?: string;
  methodology?: string;
  trialFree?: boolean;
}

export function TutorProfileForm({ initial, labels }: { initial?: TutorProfileInitial; labels: Dict["tutorOnb"] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    subjects: initial?.subjects ?? "",
    exams: initial?.exams ?? "",
    price: initial?.price ? String(initial.price) : "",
    format: initial?.format ?? "online",
    city: initial?.city ?? "Онлайн",
    experience: initial?.experience ? String(initial.experience) : "",
    bio: initial?.bio ?? "",
    methodology: initial?.methodology ?? "",
    trialFree: initial?.trialFree ?? true,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await fetch("/api/tutor/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, timezone }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || labels.saveError);
    router.push("/tutor");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={labels.examsLabel} hint={labels.examsHint}>
        <Input value={form.exams} onChange={(e) => set("exams", e.target.value)} placeholder="IELTS, SAT" required />
      </Field>
      <Field label={labels.subjectsLabel} hint={labels.commaHint}>
        <Input value={form.subjects} onChange={(e) => set("subjects", e.target.value)} placeholder="IELTS Writing, Speaking" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label={labels.priceLabel}>
          <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="12000" required />
        </Field>
        <Field label={labels.experienceLabel}>
          <Input type="number" value={form.experience} onChange={(e) => set("experience", e.target.value)} placeholder="5" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label={labels.formatLabel}>
          <select
            value={form.format}
            onChange={(e) => set("format", e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="online">{labels.online}</option>
            <option value="offline">{labels.offline}</option>
            <option value="hybrid">{labels.hybrid}</option>
          </select>
        </Field>
        <Field label={labels.cityLabel}>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
      </div>
      <Field label={labels.aboutLabel}>
        <textarea
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          placeholder={labels.aboutPh}
        />
      </Field>
      <Field label={labels.eduLabel}>
        <Input value={form.methodology} onChange={(e) => set("methodology", e.target.value)} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.trialFree} onChange={(e) => set("trialFree", e.target.checked)} />
        {labels.freeTrialCheck}
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? labels.saving : labels.saveProfile}
      </Button>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
