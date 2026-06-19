"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ConfirmPaymentButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    await fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button size="sm" variant="success" onClick={confirm} disabled={loading}>
      {loading ? "…" : "Подтвердить оплату"}
    </Button>
  );
}
