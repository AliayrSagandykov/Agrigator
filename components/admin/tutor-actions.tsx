"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Dict } from "@/lib/i18n";

export function TutorActions({
  userId,
  sponsored,
  aiVerified,
  labels,
}: {
  userId: string;
  sponsored: boolean;
  aiVerified: boolean;
  labels: Dict["admin"];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function act(action: string) {
    if (action === "delete" && !confirm(labels.deleteConfirm)) return;
    setLoading(true);
    await fetch("/api/admin/tutors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <Toggle on={sponsored} disabled={loading} onClick={() => act("toggleSponsored")}>
        {labels.adReklama}
      </Toggle>
      <Toggle on={aiVerified} disabled={loading} onClick={() => act("toggleVerified")}>
        {labels.verified}
      </Toggle>
      <button
        disabled={loading}
        onClick={() => act("delete")}
        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
      >
        {labels.deleteBtn}
      </button>
    </div>
  );
}

function Toggle({
  on,
  disabled,
  onClick,
  children,
}: {
  on: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
        on ? "border-success bg-success/10 text-success" : "border-border text-muted-foreground hover:border-primary/50",
      )}
    >
      {on ? "✓ " : ""}
      {children}
    </button>
  );
}
