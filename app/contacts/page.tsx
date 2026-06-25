import Link from "next/link";
import { Building2, Heart, Send, MapPin, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { getT } from "@/lib/locale";

const TELEGRAM_HANDLE = "Aliyar_Sagandykov";
const TELEGRAM_URL = `https://t.me/${TELEGRAM_HANDLE}`;

export function generateMetadata() {
  return { title: getT().contacts.metaTitle };
}

export default function ContactsPage() {
  const c = getT().contacts;

  return (
    <div>
      {/* ───────── HERO ───────── */}
      <section className="border-b border-border bg-gradient-to-b from-accent/40 to-background">
        <div className="container py-16 text-center md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Building2 size={14} className="text-primary" /> {c.badge}
          </span>
          <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
            {c.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{c.heroSub}</p>
        </div>
      </section>

      {/* ───────── ФИЛОСОФИЯ + ОСНОВАТЕЛЬ ───────── */}
      <section className="container grid gap-5 py-14 md:grid-cols-2">
        <Card className="h-full">
          <CardContent>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-white shadow-md">
              <Sparkles size={22} />
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">{c.philosophyTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.philosophyBody}</p>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar name={c.founderName} size={64} />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {c.founderTitle}
                </div>
                <div className="text-lg font-semibold tracking-tight">{c.founderName}</div>
                <div className="text-sm text-primary">{c.founderRole}</div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{c.founderBody}</p>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block">
              <Button>
                <Send size={16} /> {c.writeBtn}
              </Button>
            </a>
          </CardContent>
        </Card>
      </section>

      {/* ───────── КАК СВЯЗАТЬСЯ ───────── */}
      <section className="border-t border-border bg-muted/30">
        <div className="container py-14">
          <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl">{c.reachTitle}</h2>
          <div className="mx-auto mt-8 grid max-w-3xl gap-5 sm:grid-cols-2">
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-md">
                <Send size={20} />
              </div>
              <div className="min-w-0">
                <div className="font-semibold">{c.telegramLabel}</div>
                <div className="truncate text-sm text-primary group-hover:underline">@{TELEGRAM_HANDLE}</div>
              </div>
            </a>

            <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
                <MapPin size={20} />
              </div>
              <div className="min-w-0">
                <div className="font-semibold">{c.locationLabel}</div>
                <div className="text-sm text-muted-foreground">{c.locationValue}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── ПОДДЕРЖАТЬ ПРОЕКТ (донаты) ───────── */}
      <section id="donate" className="container scroll-mt-20 py-16">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary to-violet-600 px-6 py-12 text-center shadow-xl md:py-16">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
              <Heart size={26} className="fill-white" />
            </div>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-4xl">{c.donateTitle}</h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-white/90 md:text-lg">{c.donateBody}</p>
            <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
              <Gift size={15} /> {c.donateReq}
            </p>
            <div className="mt-7">
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                  <Send size={18} /> {c.donateBtn}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
