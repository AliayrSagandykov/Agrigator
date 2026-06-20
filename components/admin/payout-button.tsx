"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PayoutButton({ tutorId }: { tutorId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function payout() {
    setLoading(true);
    await fetch("/api/payments/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tutorId }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button size="sm" variant="success" onClick={payout} disabled={loading}>
      {loading ? "…" : "Выплатить"}
    </Button>
  );
}
