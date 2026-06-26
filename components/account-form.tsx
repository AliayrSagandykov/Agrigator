"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Upload, Trash2 } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AVATAR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Labels {
  name: string;
  email: string;
  avatar: string;
  avatarHint: string;
  uploadPhoto: string;
  removePhoto: string;
  save: string;
  saving: string;
  saved: string;
  errName: string;
  errEmail: string;
  errEmailTaken: string;
  errPhoto: string;
  errGeneric: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Ресайз выбранного изображения: квадратный cover-кроп до 256×256, JPEG data-URL.
function resizeImage(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no-ctx"));
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("img"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}

export function AccountForm({
  initial,
  labels,
}: {
  initial: { name: string; email: string; avatarColor: string; photo: string | null };
  labels: Labels;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [color, setColor] = useState(initial.avatarColor);
  const [photo, setPhoto] = useState<string | null>(initial.photo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const dirty =
    name.trim() !== initial.name ||
    email.trim().toLowerCase() !== initial.email.toLowerCase() ||
    color !== initial.avatarColor ||
    photo !== initial.photo;

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // позволяем выбрать тот же файл снова
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError(labels.errPhoto);
    try {
      setPhoto(await resizeImage(file));
      setError("");
    } catch {
      setError(labels.errPhoto);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!name.trim()) return setError(labels.errName);
    if (!EMAIL_RE.test(email.trim())) return setError(labels.errEmail);

    setSaving(true);
    const res = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), avatarColor: color, photo }),
    });
    setSaving(false);

    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
      return;
    }
    const j = await res.json().catch(() => ({}));
    setError(
      j.error === "taken"
        ? labels.errEmailTaken
        : j.error === "email"
          ? labels.errEmail
          : j.error === "name"
            ? labels.errName
            : j.error === "photo"
              ? labels.errPhoto
              : labels.errGeneric,
    );
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <Field label={labels.name}>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Field label={labels.email}>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>

      <div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-start sm:gap-4">
        <label className="pt-1 text-sm font-medium">{labels.avatar}</label>
        <div>
          <div className="flex items-center gap-4">
            <Avatar name={name || "?"} photo={photo} color={color} size={64} />
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onPickFile}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={15} /> {labels.uploadPhoto}
                </Button>
                {photo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer text-muted-foreground"
                    onClick={() => setPhoto(null)}
                  >
                    <Trash2 size={15} /> {labels.removePhoto}
                  </Button>
                )}
              </div>
              {!photo && (
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-label={c}
                      className={cn(
                        "flex h-7 w-7 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-background transition",
                        color === c ? "ring-2 ring-foreground" : "hover:scale-110",
                      )}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{labels.avatarHint}</p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={saving || !dirty} className="cursor-pointer">
          {saving ? labels.saving : labels.save}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
            <Check size={15} /> {labels.saved}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-center sm:gap-4">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
