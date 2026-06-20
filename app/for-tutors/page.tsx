import Link from "next/link";
import { Check, TrendingUp, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getT } from "@/lib/locale";

export const metadata = { title: "Тьюторам — Agrigator" };

export default function ForTutorsPage() {
  const t = getT();
  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-accent/40 to-background">
        <div className="container py-16 text-center">
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight">
            {t.forTutors.heroLead}
            <span className="brand-grad">{t.forTutors.heroHL}</span>
            {t.forTutors.heroTail}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{t.forTutors.subtitle}</p>
          <Link href="/register?role=tutor" className="mt-7 inline-block">
            <Button size="lg">{t.forTutors.cta}</Button>
          </Link>
        </div>
      </section>

      <section className="container grid gap-5 py-14 md:grid-cols-2">
        <Benefit icon={<TrendingUp className="text-primary" />} title={t.forTutors.b1Title}>
          {t.forTutors.b1Body}
        </Benefit>
        <Benefit icon={<ShieldCheck className="text-success" />} title={t.forTutors.b2Title}>
          {t.forTutors.b2Body}
        </Benefit>
        <Benefit icon={<Wallet className="text-primary" />} title={t.forTutors.b3Title}>
          {t.forTutors.b3Body}
        </Benefit>
        <Benefit icon={<Check className="text-success" />} title={t.forTutors.b4Title}>
          {t.forTutors.b4Body}
        </Benefit>
      </section>
    </div>
  );
}

function Benefit({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">{icon}</div>
        <h3 className="mt-3 font-semibold">{title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{children}</p>
      </CardContent>
    </Card>
  );
}
