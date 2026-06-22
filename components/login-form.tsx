"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import type { Dict } from "@/lib/i18n";

export function LoginForm({ labels }: { labels: Dict["auth"] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || labels.loginError);
      return;
    }
    const dest = data.user.role === "tutor" ? "/tutor" : data.user.role === "admin" ? "/admin" : "/dashboard";
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="container flex justify-center py-16">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold">{labels.loginTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{labels.loginSub}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{labels.password}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? labels.signingIn : labels.signIn}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {labels.noAccount}{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            {labels.registerLink}
          </Link>
        </p>
        <div className="mt-6 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <div className="font-medium">{labels.demoLogins}</div>
          <div>student — user@demo.kz / demo123</div>
          <div>tutor — aigerim@agrigator.kz / tutor123</div>
          <div>admin — admin@agrigator.kz / admin123</div>
        </div>
      </Card>
    </div>
  );
}
