"use client";
import { useState } from "react";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dict } from "@/lib/i18n";

// Оценка урока студентом (UX §2.9): одна шкала + опц. строка, скипабельно.
export function LessonReview({ bookingId, tutorName, labels }: { bookingId: string; tutorName: string; labels: Dict["dash"] }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!rating) return;
    setLoading(true);
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, rating, note }),
    });
    setLoading(false);
    setDone(true);
  }

  if (hidden) return null;
  if (done)
    return (
      <div className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
        {labels.thanksRating}
      </div>
    );

  return (
    <div className="relative rounded-lg border border-border bg-muted/30 p-3">
      <button
        onClick={() => setHidden(true)}
        className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
        aria-label={labels.skip}
      >
        <X size={15} />
      </button>
      <div className="text-sm font-medium">{labels.howWasLessonPre}{tutorName}?</div>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            aria-label={`${n} ${labels.stars}`}
          >
            <Star
              size={22}
              className={cn(
                "transition-colors",
                (hover || rating) >= n ? "text-amber-500" : "text-muted-foreground/40",
              )}
              fill={(hover || rating) >= n ? "currentColor" : "none"}
            />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <div className="mt-2 space-y-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={labels.fewWords}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          />
          <button
            onClick={submit}
            disabled={loading}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "…" : labels.send}
          </button>
        </div>
      )}
    </div>
  );
}
