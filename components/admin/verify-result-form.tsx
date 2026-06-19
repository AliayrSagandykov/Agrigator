"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Оператор вводит финальный балл из score report. delta считает система.
export function VerifyResultForm({
  resultId,
  baseline,
}: {
  resultId: string;
  baseline: number | null;
}) {
  const router = useRouter();
  const [finalScore, setFinalScore] = useState("");
  const [loading, setLoading] = useState(false);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/results/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultId, finalScore: Number(finalScore) }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={verify} className="flex items-end gap-2">
      <div className="w-32">
        <label className="text-xs text-muted-foreground">Финальный балл</label>
        <Input
          type="number"
          step="any"
          value={finalScore}
          onChange={(e) => setFinalScore(e.target.value)}
          required
        />
      </div>
      <Button size="sm" disabled={loading || !finalScore}>
        {loading ? "…" : baseline != null ? `Δ = ${finalScore || "?"} − ${baseline}` : "Проставить дельту"}
      </Button>
    </form>
  );
}
