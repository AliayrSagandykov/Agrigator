"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dict } from "@/lib/i18n";

// Тютор отмечает тему урока в один тап (UX v3 §2.2). Студенту тема видна как текст.
export function LessonNoteForm({
  lessonId,
  topic,
  canEdit,
  labels,
}: {
  lessonId: string;
  topic: string;
  canEdit: boolean;
  labels: Dict["room"];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(topic);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    await fetch("/api/room/lesson-note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, topic: value.trim() }),
    });
    setLoading(false);
    setEditing(false);
    router.refresh();
  }

  if (!canEdit) {
    return topic ? (
      <span className="text-sm text-foreground">{topic}</span>
    ) : (
      <span className="text-sm italic text-muted-foreground">{labels.topicUnset}</span>
    );
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        {topic ? <span className="text-foreground">{topic}</span> : <span className="italic">{labels.topicSet}</span>}
        <Pencil size={12} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        className="h-8 w-60"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={labels.topicPh}
        onKeyDown={(e) => e.key === "Enter" && save()}
      />
      <Button size="sm" onClick={save} disabled={loading} aria-label={labels.save}>
        <Check size={14} />
      </Button>
    </div>
  );
}
