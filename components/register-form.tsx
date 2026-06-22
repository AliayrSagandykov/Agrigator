"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import type { Dict } from "@/lib/i18n";

export function RegisterForm({ labels }: { labels: Dict["auth"] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<"student" | "tutor">(
    params.get("role") === "tutor" ? "tutor" : "student",
  );
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", parentPhone: "" });
  const [isMinor, setIsMinor] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role, isMinor }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || labels.registerError);
      return;
    }
    // Студент → интейк-онбординг; тютор → онбординг профиля.
    router.push(role === "tutor" ? "/tutor/onboarding" : "/onboarding");
    router.refresh();
  }

  return (
    <div className="container flex justify-center py-16">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold">{labels.registerTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {role === "tutor" ? labels.tutorFree : labels.minFields}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          <RoleTab active={role === "student"} onClick={() => setRole("student")}>
            {labels.iSeekTutor}
          </RoleTab>
          <RoleTab active={role === "tutor"} onClick={() => setRole("tutor")}>
            {labels.iAmTutor}
          </RoleTab>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field label={labels.name} id="name">
            <Input id="name" value={form.name} onChange={set("name")} required />
          </Field>
          <Field label="Email" id="email">
            <Input id="email" type="email" value={form.email} onChange={set("email")} required />
          </Field>
          <Field label={labels.phone} id="phone" hint={labels.phoneHint}>
            <Input id="phone" type="tel" placeholder="+7 ___ ___ __ __" value={form.phone} onChange={set("phone")} />
          </Field>
          <Field label={labels.password} id="password">
            <Input id="password" type="password" value={form.password} onChange={set("password")} required />
          </Field>

          {role === "student" && (
            <div className="rounded-lg border border-border p-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isMinor} onChange={(e) => setIsMinor(e.target.checked)} />
                {labels.under18}
              </label>
              {isMinor && (
                <div className="mt-3">
                  <Field label={labels.parentPhone} id="parentPhone" hint={labels.parentPhoneHint}>
                    <Input id="parentPhone" type="tel" value={form.parentPhone} onChange={set("parentPhone")} required />
                  </Field>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? labels.creating : labels.createAccount}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {labels.haveAccount}{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {labels.signIn}
          </Link>
        </p>
      </Card>
    </div>
  );
}

function RoleTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, id, hint, children }: { label: string; id: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
