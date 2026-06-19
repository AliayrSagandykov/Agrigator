"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { RETENTION_REASONS } from "@/lib/constants";

// Ретеншн-микровопрос (UX §2.10): 4 кнопки, скипабельно.
export function RetentionQuestion({ tutorId, tutorName }: { tutorId: string; tutorName: string }) {
  const [hidden, setHidden] = useState(false);
  const [answered, setAnswered] = useState(false);

  async function answer(reason: string) {
    setAnswered(true);
    await fetch("/api/retention", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tutorId, reason }),
    });
    setTimeout(() => setHidden(true), 900);
  }

  if (hidden) return null;

  return (
    <div className="relative rounded-xl border border-primary/30 bg-accent p-4">
      <button
        onClick={() => setHidden(true)}
        className="absolute right-3 top-3 text-accent-foreground/60 hover:text-accent-foreground"
        aria-label="Закрыть"
      >
        <X size={16} />
      </button>
      {answered ? (
        <p className="text-sm font-medium text-accent-foreground">Спасибо! Это помогает считать удержание честно.</p>
      ) : (
        <>
          <p className="font-medium text-accent-foreground">Продолжаешь заниматься с {tutorName}?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {RETENTION_REASONS.map((r) => (
              <button
                key={r.value}
                onClick={() => answer(r.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:border-primary"
              >
                {r.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
