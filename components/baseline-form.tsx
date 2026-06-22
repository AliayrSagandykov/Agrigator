"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dict } from "@/lib/i18n";

// Установка baseline студентом (UX §2.2). Дельта = финал − baseline считается потом.
export function BaselineForm({ labels }: { labels: Dict["dash"] }) {
  const router = useRouter();
  const [score, setScore] = useState("");
  const [source, setSource] = useState("official");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/student/baseline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, source }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || labels.saveError);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <p className="text-sm text-muted-foreground">{labels.baselineHint}</p>
      <div className="flex gap-2">
        <Input
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder={labels.scorePh}
          className="w-32"
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="official">{labels.official}</option>
          <option value="diagnostic">{labels.diagnostic}</option>
        </select>
        <Button type="submit" size="sm" disabled={loading || !score}>
          {loading ? "…" : labels.setBaseline}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
