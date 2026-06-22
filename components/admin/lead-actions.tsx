"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Dict } from "@/lib/i18n";

export function LeadActions({ id, labels }: { id: string; labels: Dict["admin"] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function act(action: string) {
    setLoading(true);
    await fetch("/api/admin/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex shrink-0 gap-2">
      <Button size="sm" variant="success" disabled={loading} onClick={() => act("import")}>
        {labels.importBtn}
      </Button>
      <Button size="sm" variant="ghost" disabled={loading} onClick={() => act("reject")}>
        {labels.reject}
      </Button>
    </div>
  );
}
