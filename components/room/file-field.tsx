"use client";
import { useState } from "react";
import { Paperclip, Check } from "lucide-react";

// Загружает файл в Supabase Storage через /api/upload, отдаёт url наверх.
export function FileField({ onUploaded }: { onUploaded: (url: string, name: string) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || "Не удалось загрузить");
    setName(file.name);
    onUploaded(data.url, file.name);
  }

  return (
    <div className="flex items-center gap-2">
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-muted">
        <Paperclip size={14} /> {busy ? "Загрузка…" : "Файл"}
        <input type="file" className="hidden" onChange={onFile} disabled={busy} />
      </label>
      {name && (
        <span className="inline-flex items-center gap-1 text-xs text-success">
          <Check size={12} /> {name}
        </span>
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
