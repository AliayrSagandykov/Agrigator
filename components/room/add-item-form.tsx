"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileField } from "@/components/room/file-field";

// Добавить материал или задать домашку (type) — UX v3 §2.3–2.4.
export function AddItemForm({ pairId, type }: { pairId: string; type: "material" | "homework" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isHw = type === "homework";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/room/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairId, type, title, body, fileUrl, dueAt: dueAt ? new Date(dueAt).toISOString() : null }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error || "Не удалось сохранить");
    setOpen(false);
    setTitle(""); setBody(""); setFileUrl(""); setDueAt("");
    router.refresh();
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {isHw ? "Задать домашку" : "Добавить материал"}
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-lg border border-border p-3">
      <Input placeholder="Название" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        placeholder={isHw ? "Что сделать" : "Описание (необязательно)"}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap items-center gap-3">
        <FileField onUploaded={(url) => setFileUrl(url)} />
        {isHw && (
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            дедлайн
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="rounded-lg border border-input bg-background px-2 py-1 text-sm"
            />
          </label>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>{loading ? "…" : "Сохранить"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Отмена</Button>
      </div>
    </form>
  );
}
