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
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) return setError(data.error || "Не удалось загрузить файл");
    setReportUrl(data.url);
    setFileName(file.name);
  }

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
      <div className="flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-lg border border-input px-3 py-2 text-sm hover:bg-muted">
          {uploading ? "Загружаем…" : "Прикрепить файл"}
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onFile} disabled={uploading} />
        </label>
        {fileName && <span className="text-xs text-success">✓ {fileName}</span>}
      </div>
      <Input
        placeholder="…или ссылка на score report"
        value={reportUrl}
        onChange={(e) => { setReportUrl(e.target.value); setFileName(""); }}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="outline" disabled={loading}>
        <Upload size={15} /> {loading ? "Отправляем…" : "Загрузить результат"}
      </Button>
    </form>
  );
}
