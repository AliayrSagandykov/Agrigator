"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Dict } from "@/lib/i18n";

export function ConfirmPaymentButton({ bookingId, labels }: { bookingId: string; labels: Dict["admin"] }) {
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
      {loading ? "…" : labels.confirmPayment}
    </Button>
  );
}
