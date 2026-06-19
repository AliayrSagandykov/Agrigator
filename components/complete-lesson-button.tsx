"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CompleteLessonButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function complete() {
    setLoading(true);
    await fetch("/api/lessons/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" onClick={complete} disabled={loading}>
      {loading ? "…" : "Урок проведён"}
    </Button>
  );
}
