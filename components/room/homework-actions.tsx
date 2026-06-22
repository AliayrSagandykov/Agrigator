"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileField } from "@/components/room/file-field";
import type { Dict } from "@/lib/i18n";

// Ученик сдаёт домашку.
export function SubmitHomeworkForm({ homeworkId, labels }: { homeworkId: string; labels: Dict["room"] }) {
  const router = useRouter();
  const [fileUrl, setFileUrl] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/room/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeworkId, fileUrl, body }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-wrap items-center gap-2">
      <FileField onUploaded={(url) => setFileUrl(url)} labels={labels} />
      <Input className="h-9 w-44" placeholder={labels.submitPh} value={body} onChange={(e) => setBody(e.target.value)} />
      <Button type="submit" size="sm" disabled={loading || (!fileUrl && !body)}>
        {loading ? "…" : labels.submit}
      </Button>
    </form>
  );
}

// Тютор проверяет домашку.
export function ReviewHomeworkForm({ homeworkId, labels }: { homeworkId: string; labels: Dict["room"] }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/room/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeworkId, reviewNote: note }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-wrap items-center gap-2">
      <Input className="h-9 w-52" placeholder={labels.reviewPh} value={note} onChange={(e) => setNote(e.target.value)} />
      <Button type="submit" size="sm" variant="success" disabled={loading}>
        {loading ? "…" : labels.reviewed}
      </Button>
    </form>
  );
}
