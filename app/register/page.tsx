"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

function RegisterForm() {
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
      setError(data.error || "Не удалось зарегистрироваться");
      return;
    }
    // Студент → интейк-онбординг; тютор → онбординг профиля.
    router.push(role === "tutor" ? "/tutor/onboarding" : "/onboarding");
    router.refresh();
  }

  return (
    <div className="container flex justify-center py-16">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold">Регистрация</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {role === "tutor" ? "Регистрация для тьюторов бесплатна навсегда." : "Минимум полей — и сразу к подбору."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          <RoleTab active={role === "student"} onClick={() => setRole("student")}>
            Я ищу тютора
          </RoleTab>
          <RoleTab active={role === "tutor"} onClick={() => setRole("tutor")}>
            Я тютор
          </RoleTab>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <Field label="Имя" id="name">
            <Input id="name" value={form.name} onChange={set("name")} required />
          </Field>
          <Field label="Email" id="email">
            <Input id="email" type="email" value={form.email} onChange={set("email")} required />
          </Field>
          <Field label="Телефон" id="phone" hint="Для брони и напоминаний">
            <Input id="phone" type="tel" placeholder="+7 ___ ___ __ __" value={form.phone} onChange={set("phone")} />
          </Field>
          <Field label="Пароль" id="password">
            <Input id="password" type="password" value={form.password} onChange={set("password")} required />
          </Field>

          {role === "student" && (
            <div className="rounded-lg border border-border p-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isMinor} onChange={(e) => setIsMinor(e.target.checked)} />
                Мне меньше 18 лет
              </label>
              {isMinor && (
                <div className="mt-3">
                  <Field label="Телефон родителя" id="parentPhone" hint="Нужен для оплаты и согласия (закон РК)">
                    <Input id="parentPhone" type="tel" value={form.parentPhone} onChange={set("parentPhone")} required />
                  </Field>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Создаём…" : "Создать аккаунт"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Войти
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

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
