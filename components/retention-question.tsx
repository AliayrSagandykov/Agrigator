"use client";
import { useState } from "react";
import { X } from "lucide-react";
import type { Dict } from "@/lib/i18n";

// Ретеншн-микровопрос (UX §2.10): 4 кнопки, скипабельно.
export function RetentionQuestion({ tutorId, tutorName, labels }: { tutorId: string; tutorName: string; labels: Dict["dash"] }) {
  const [hidden, setHidden] = useState(false);
  const [answered, setAnswered] = useState(false);
  const reasons = [
    { value: "pause", label: labels.rPause },
    { value: "goal_reached", label: labels.rGoal },
    { value: "not_fit", label: labels.rNotFit },
    { value: "expensive", label: labels.rExpensive },
  ];

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
        aria-label={labels.close}
      >
        <X size={16} />
      </button>
      {answered ? (
        <p className="text-sm font-medium text-accent-foreground">{labels.thanksRetention}</p>
      ) : (
        <>
          <p className="font-medium text-accent-foreground">{labels.stillStudyingPre}{tutorName}?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {reasons.map((r) => (
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
