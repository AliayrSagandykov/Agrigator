"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Dict } from "@/lib/i18n";

// Ответ тютора на бронь (UX §3.2): принять / отклонить / предложить другое время.
export function BookingRespondButtons({ bookingId, labels }: { bookingId: string; labels: Dict["tutorDash"] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reschedule, setReschedule] = useState(false);
  const [slotAt, setSlotAt] = useState("");

  async function respond(action: string, extra: Record<string, unknown> = {}) {
    setLoading(true);
    await fetch("/api/bookings/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, action, ...extra }),
    });
    setLoading(false);
    router.refresh();
  }

  if (reschedule) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="datetime-local"
          value={slotAt}
          onChange={(e) => setSlotAt(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
        />
        <Button
          size="sm"
          disabled={loading || !slotAt}
          onClick={() => respond("reschedule", { slotAt: new Date(slotAt).toISOString() })}
        >
          {labels.propose}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setReschedule(false)} disabled={loading}>
          {labels.cancel}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="success" disabled={loading} onClick={() => respond("accept")}>
        {labels.accept}
      </Button>
      <Button size="sm" variant="outline" disabled={loading} onClick={() => setReschedule(true)}>
        {labels.otherTime}
      </Button>
      <Button size="sm" variant="ghost" disabled={loading} onClick={() => respond("decline")}>
        {labels.decline}
      </Button>
    </div>
  );
}
