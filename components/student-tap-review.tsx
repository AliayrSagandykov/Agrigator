"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dict } from "@/lib/i18n";

// Оценка студента тютором (UX §3.6): пара тапов — вовремя? ДЗ?
export function StudentTapReview({ bookingId, studentName, labels }: { bookingId: string; studentName: string; labels: Dict["tutorDash"] }) {
  const [onTime, setOnTime] = useState(false);
  const [homework, setHomework] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, onTime, homework }),
    });
    setLoading(false);
    setDone(true);
  }

  if (done) return <span className="text-xs text-success">{labels.rated}</span>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle active={onTime} onClick={() => setOnTime((v) => !v)}>{labels.onTime}</Toggle>
      <Toggle active={homework} onClick={() => setHomework((v) => !v)}>{labels.didHomework}</Toggle>
      <button
        onClick={submit}
        disabled={loading}
        className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
      >
        {loading ? "…" : labels.rate}
      </button>
    </div>
  );
}

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
        active ? "border-success bg-success/10 text-success" : "border-border text-muted-foreground",
      )}
    >
      {active && <Check size={12} />} {children}
    </button>
  );
}
