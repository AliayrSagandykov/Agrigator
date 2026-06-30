"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Labels {
  placeholder: string;
  save: string;
  saving: string;
  saved: string;
  error: string;
}

// Инлайн-поле в дашборде тьютора: вставить/обновить Calendly-ссылку.
export function CalendlyField({ initial, labels }: { initial: string; labels: Labels }) {
  const router = useRouter();
  const [url, setUrl] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const dirty = url.trim() !== initial;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    const res = await fetch("/api/tutor/calendly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendly: url.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
      return;
    }
    const j = await res.json().catch(() => ({}));
    setError(j.error || labels.error);
  }

  return (
    <form onSubmit={save} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3">
          <Link2 size={16} className="shrink-0 text-muted-foreground" />
          <Input
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={labels.placeholder}
            className="border-0 bg-transparent px-0 focus-visible:ring-0"
          />
        </div>
        <Button type="submit" disabled={saving || !dirty} className="cursor-pointer sm:w-auto">
          {saving ? labels.saving : labels.save}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && (
        <p className="inline-flex items-center gap-1 text-sm font-medium text-success">
          <Check size={15} /> {labels.saved}
        </p>
      )}
    </form>
  );
}
