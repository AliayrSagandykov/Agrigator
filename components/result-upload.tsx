"use client";
import { useState } from "react";
import { Upload, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Загрузка результата (UX §2.11). Студент грузит report — число не вводит.
// Дельту посчитает верификация. reportUrl на проде = Supabase Storage.
export function ResultUpload({
  tutors,
  defaultExam,
}: {
  tutors: { id: string; name: string }[];
  defaultExam?: string | null;
}) {
  const [tutorId, setTutorId] = useState(tutors[0]?.id ?? "");
  const [exam, setExam] = useState(defaultExam ?? "");
  const [reportUrl, setReportUrl] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tutorId, exam, reportUrl }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || "Не удалось отправить");
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
        <Check size={16} /> Отчёт отправлен на верификацию. Дельту посчитает система.
      </div>
    );
  }

  if (tutors.length === 0) {
    return <p className="text-sm text-muted-foreground">Появится после первого проведённого урока.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          value={tutorId}
          onChange={(e) => setTutorId(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          {tutors.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <Input placeholder="Экзамен (напр. IELTS)" value={exam} onChange={(e) => setExam(e.target.value)} required />
      </div>
      <Input
        placeholder="Ссылка/имя файла score report (PDF/скрин)"
        value={reportUrl}
        onChange={(e) => setReportUrl(e.target.value)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="outline" disabled={loading}>
        <Upload size={15} /> {loading ? "Отправляем…" : "Загрузить результат"}
      </Button>
    </form>
  );
}
