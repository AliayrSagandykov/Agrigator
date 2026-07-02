import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, ShieldCheck, ChevronRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { getTutorCards } from "@/lib/tutors";
import type { StudentGoal } from "@/lib/types";
import { rankTutors } from "@/lib/match";
import { parseJson, formatPrice } from "@/lib/utils";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeltaChart } from "@/components/delta-chart";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";
import { getT } from "@/lib/locale";

export const metadata = { title: "Ваш мэтч — Agrigator" };

export default async function MatchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/register?role=student");

  const goal = await one<StudentGoal>(`select * from "StudentGoal" where "userId" = $1`, [user.id]);
  if (!goal) redirect("/onboarding");

  const L = getT().match;

  const tutors = await getTutorCards();
  const ranked = rankTutors(
    tutors.map((t) => ({
      id: t.id,
      exams: t.exams,
      delta: t.metrics.delta,
      sample: t.metrics.sample,
      retention: t.metrics.retention,
      passRate: t.metrics.passRate,
      rating: t.rating,
      aiVerified: t.aiVerified,
      price: t.price,
      format: t.format,
      languages: t.languages,
      timezone: t.timezone,
    })),
    {
      exam: goal.exam,
      deadline: goal.deadline,
      formats: parseJson<string[]>(goal.formatsJson, []),
      languages: parseJson<string[]>(goal.languagesJson, []),
      timezone: user.timezone,
    },
  );

  const byId = new Map(tutors.map((t) => [t.id, t]));
  const top = ranked[0];
  const topTutor = top ? byId.get(top.id) : null;
  const others = ranked.slice(1, 6);

  return (
    <div className="relative overflow-hidden">
      {/* Мягкий фон в духе Apple: нейтраль + едва заметное свечение */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-muted/30">
        <div className="absolute left-1/2 top-[-10rem] h-[26rem] w-[44rem] max-w-[110vw] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/15 via-violet-400/10 to-sky-400/10 blur-3xl" />
      </div>

      <div className="container max-w-2xl py-14 md:py-20">
        {/* Заголовок-reveal */}
        <div className="rise text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
            <Sparkles size={13} /> {L.topBadge}
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">{L.reveal}</h1>
          <p className="mt-3 text-muted-foreground">
            {L.revealSub} · {goal.exam} ·{" "}
            <Link href="/onboarding" className="text-primary hover:underline">{L.change}</Link>
          </p>
        </div>

        {/* Герой-карточка топ-мэтча */}
        {top && topTutor && (
          <Reveal delay={120}>
            <div className="mt-10 rounded-3xl border border-border bg-card p-8 shadow-xl shadow-primary/5 md:p-10">
              <div className="text-center">
                <div className="brand-grad text-7xl font-semibold leading-none tracking-tighter md:text-8xl">
                  <CountUp to={top.percent} suffix="%" duration={1600} />
                </div>
                <div className="mt-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  {L.matchWord}
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center gap-4 text-center">
                <Avatar name={topTutor.name} photo={topTutor.photo} color={topTutor.avatarColor} size={88} />
                <div>
                  <div className="flex items-center justify-center gap-2 text-2xl font-semibold tracking-tight">
                    {topTutor.name}
                    {topTutor.aiVerified && <ShieldCheck size={20} className="text-success" />}
                  </div>
                  <div className="mt-1 text-muted-foreground">{topTutor.subjects}</div>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {topTutor.exams.map((e) => (
                    <Badge key={e} variant="secondary">{e}</Badge>
                  ))}
                </div>
              </div>

              {topTutor.metrics.sample > 0 && (
                <div className="mt-8 rounded-2xl bg-muted/40 p-5">
                  <DeltaChart
                    metric={topTutor.metrics.metric}
                    before={topTutor.metrics.before}
                    after={topTutor.metrics.after}
                    sample={topTutor.metrics.sample}
                  />
                </div>
              )}

              {top.reasons.length > 0 && (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {top.reasons.map((r) => (
                    <span key={r} className="rounded-full bg-muted px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
                      {r}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
                <div className="text-lg font-semibold">{formatPrice(topTutor.price, topTutor.priceUnit)}</div>
                <Link href={`/tutors/${topTutor.id}`} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full cursor-pointer rounded-xl px-8">
                    {L.viewProfile}
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>
        )}

        {/* Остальные — с меньшим процентом */}
        {others.length > 0 && (
          <div className="mt-14">
            <Reveal>
              <h2 className="text-xl font-semibold tracking-tight">{L.othersTitle}</h2>
            </Reveal>
            <div className="mt-4 space-y-3">
              {others.map((r, i) => {
                const t = byId.get(r.id);
                if (!t) return null;
                return (
                  <Reveal key={r.id} delay={i * 70}>
                    <Link
                      href={`/tutors/${t.id}`}
                      className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                    >
                      <Avatar name={t.name} photo={t.photo} color={t.avatarColor} size={52} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span className="truncate">{t.name}</span>
                          {t.aiVerified && <ShieldCheck size={15} className="shrink-0 text-success" />}
                        </div>
                        <div className="mt-0.5 truncate text-sm text-muted-foreground">
                          {t.exams.join(", ")} · {formatPrice(t.price, t.priceUnit)}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xl font-semibold tracking-tight text-primary">{r.percent}%</div>
                        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          {L.matchWord}
                        </div>
                      </div>
                      <ChevronRight size={18} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        )}

        {/* Скипабельный оффер диагностики (UX §2.2) */}
        {!goal.baselineScore && (
          <Reveal>
            <div className="mt-12 rounded-2xl border border-border bg-card/60 p-5 text-center">
              <div className="font-medium">{L.diagTitle}</div>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{L.diagBody}</p>
              <div className="mt-4 flex items-center justify-center gap-4">
                <Link href="/diagnostic">
                  <Button variant="outline" className="cursor-pointer rounded-xl">{L.takeDiag}</Button>
                </Link>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
                  {L.later}
                </Link>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
