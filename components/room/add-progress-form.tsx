"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dict } from "@/lib/i18n";

// Добавить точку прогресса (балл пробника).
export function AddProgressForm({ pairId, labels }: { pairId: string; labels: Dict["room"] }) {
  const router = useRouter();
  const [score, setScore] = useState("");
  const [source, setSource] = useState("mock");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/room/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairId, score: Number(score), source, label }),
    });
    setLoading(false);
    setScore(""); setLabel("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <Input className="h-9 w-28" placeholder={labels.scorePh} value={score} onChange={(e) => setScore(e.target.value)} />
      <select value={source} onChange={(e) => setSource(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
        <option value="diagnostic">{labels.srcDiagnostic}</option>
        <option value="mock">{labels.srcMock}</option>
        <option value="official">{labels.srcOfficial}</option>
      </select>
      <Input className="h-9 w-36" placeholder={labels.labelPh} value={label} onChange={(e) => setLabel(e.target.value)} />
      <Button type="submit" size="sm" disabled={loading || !score}>{loading ? "…" : labels.add}</Button>
    </form>
  );
}
