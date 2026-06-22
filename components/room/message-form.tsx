"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dict } from "@/lib/i18n";

// Отправка сообщения в чат пары (UX v3 §2.6).
export function MessageForm({ pairId, labels }: { pairId: string; labels: Dict["room"] }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setLoading(true);
    await fetch("/api/room/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pairId, body: text }),
    });
    setLoading(false);
    setBody("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <Input
        placeholder={labels.messagePh}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
      />
      <Button type="submit" size="sm" disabled={loading || !body.trim()} aria-label={labels.messagePh}>
        <Send size={15} />
      </Button>
    </form>
  );
}
