"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

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

export function TutorProfileForm({ initial }: { initial?: TutorProfileInitial }) {
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
    const res = await fetch("/api/tutor/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || "Не удалось сохранить");
    router.push("/tutor");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Экзамены" hint="Через запятую: IELTS, SAT">
        <Input value={form.exams} onChange={(e) => set("exams", e.target.value)} placeholder="IELTS, SAT" required />
      </Field>
      <Field label="Предметы / специализация" hint="Через запятую">
        <Input value={form.subjects} onChange={(e) => set("subjects", e.target.value)} placeholder="IELTS Writing, Speaking" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Цена за час, ₸">
          <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="12000" required />
        </Field>
        <Field label="Опыт, лет">
          <Input type="number" value={form.experience} onChange={(e) => set("experience", e.target.value)} placeholder="5" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Формат">
          <select
            value={form.format}
            onChange={(e) => set("format", e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="online">Онлайн</option>
            <option value="offline">Оффлайн</option>
            <option value="hybrid">Гибрид</option>
          </select>
        </Field>
        <Field label="Город">
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
      </div>
      <Field label="О себе">
        <textarea
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          placeholder="Коротко: кого готовите, какой подход, свой результат."
        />
      </Field>
      <Field label="Образование / методика">
        <Input value={form.methodology} onChange={(e) => set("methodology", e.target.value)} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.trialFree} onChange={(e) => set("trialFree", e.target.checked)} />
        Первый пробный урок бесплатно
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Сохраняем…" : "Сохранить профиль"}
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
