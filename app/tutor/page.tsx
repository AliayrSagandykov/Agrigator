import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, TrendingUp, CalendarClock, Check, ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { parseJson, cn, formatDateTime, formatDelta, formatTenge } from "@/lib/utils";
import { computeTutorMetrics } from "@/lib/metrics";
import { getTutorBookings, getTutorPayments } from "@/lib/queries";
import { getPairsForUser } from "@/lib/pairs";
import { PairList } from "@/components/room/pair-list";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricStat } from "@/components/metric-stat";
import { Avatar } from "@/components/avatar";
import { CompleteLessonButton } from "@/components/complete-lesson-button";
import { getT } from "@/lib/locale";
import type { Dict } from "@/lib/i18n";

export const metadata = { title: "Кабинет тьютора — Agrigator" };

export default async function TutorDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");
  if (user.role !== "tutor") redirect("/dashboard");

  const profile = await one<{ photo: string | null; price: number; availabilityJson: string }>(
    `select photo, price, "availabilityJson" from "TutorProfile" where "userId" = $1`,
    [user.id],
  );
  if (!profile) redirect("/tutor/onboarding");

  const L = getT().tutorDash;
  const tz = user.timezone ?? undefined;
  const now = new Date();
  const [metrics, bookings, payments, pairs] = await Promise.all([
    computeTutorMetrics(user.id),
    getTutorBookings(user.id),
    getTutorPayments(user.id),
    getPairsForUser(user.id),
  ]);

  const requests = bookings.filter((b) => !b.hasLesson && b.slotAt >= now && b.status !== "cancelled");
  const escrow = payments.filter((p) => p.status === "confirmed").reduce((s, p) => s + p.amount, 0);
  const released = payments.filter((p) => p.status === "released").reduce((s, p) => s + p.amount, 0);

  const hasSchedule = parseJson<string[]>(profile.availabilityJson, []).length > 0;
  const hasBookings = bookings.length > 0;
  // Холодный старт: нет ни уроков, ни броней — показываем стартовый чек-лист.
  const isNew = metrics.lessons === 0 && !hasBookings;

  return (
    <div className="px-5 py-8 sm:px-8 lg:px-10">
      {/* Персонализированная шапка */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{L.hello}{user.name.split(" ")[0]}</h1>
          <p className="text-muted-foreground">{metrics.isLive ? L.subLive : L.subStarter}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/tutor/schedule">
            <Button variant="outline"><CalendarClock size={15} /> {L.schedule}</Button>
          </Link>
          <Link href="/tutor/onboarding">
            <Button variant="outline"><Pencil size={15} /> {L.profile}</Button>
          </Link>
        </div>
      </div>

      {/* Стартовый чек-лист — персонализация холодного старта */}
      {isNew && (
        <GettingStarted L={L} tutorId={user.id} hasSchedule={hasSchedule} hasBookings={hasBookings} />
      )}

      {/* Репутационный актив: портфель метрик */}
      <Card id="portfolio" className="mt-6 scroll-mt-24">
        <CardContent>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            <h2 className="font-semibold">{L.portfolio}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricStat value={formatDelta(metrics.delta)} label={L.avgDelta} hint={metrics.n ? `${metrics.n} ${L.results}` : L.starter} tone="success" />
            <MetricStat value={formatDelta(metrics.riskAdjustedDelta)} label={L.adjusted} hint={L.droppedCounted} />
            <MetricStat value={`${metrics.continuationRate}%`} label={L.continuation} tone="primary" />
            <MetricStat value={String(metrics.lessons)} label={L.lessons} />
          </div>
          {metrics.lowConfidence && (
            <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              {L.lowDataPre}{metrics.n}{L.lowDataSuf}
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            {L.portfolioNote} {metrics.isLive ? L.liveData : L.starterMetrics}
          </p>
        </CardContent>
      </Card>

      {/* Деньги */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <MetricStat value={formatTenge(escrow)} label={L.escrow} />
        <MetricStat value={formatTenge(released)} label={L.paidOut} />
        <MetricStat value={formatTenge(profile.price)} label={L.hourlyRate} />
      </div>

      {/* Кабинеты учеников — центр удержания */}
      {pairs.length > 0 && (
        <section id="rooms" className="mt-8 scroll-mt-24">
          <h2 className="mb-3 font-semibold">{L.studentRooms}</h2>
          <PairList pairs={pairs} tz={tz} />
        </section>
      )}

      {/* Входящие брони */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{L.incomingBookings}</h2>
          <Link href="/tutor/inbox" className="text-sm text-primary hover:underline">{L.all}</Link>
        </div>
        <div className="mt-3 space-y-3">
          {requests.length === 0 && (
            <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">{L.noNewBookings}</CardContent></Card>
          )}
          {requests.slice(0, 5).map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={b.student.name} color={b.student.avatarColor} size={40} />
                  <div>
                    <div className="font-medium">{b.student.name}</div>
                    <div className="text-sm text-muted-foreground">{formatDateTime(b.slotAt, tz)} · {b.kind === "trial" ? L.trial : L.lesson}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {b.acceptedAt ? (
                    <>
                      <a href={b.meetLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{L.link}</a>
                      <CompleteLessonButton bookingId={b.id} labels={L} />
                    </>
                  ) : (
                    <Badge variant="outline">{L.awaitingResp}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

// Стартовый чек-лист тьютора: три шага до первых учеников. Состояние шагов —
// из реальных данных (профиль создан · расписание указано · первая бронь).
function GettingStarted({
  L,
  tutorId,
  hasSchedule,
  hasBookings,
}: {
  L: Dict["tutorDash"];
  tutorId: string;
  hasSchedule: boolean;
  hasBookings: boolean;
}) {
  const steps = [
    { done: true, todo: L.gsProfileDone, doneLabel: L.gsProfileDone, cta: L.gsEditProfile, href: "/tutor/onboarding" },
    { done: hasSchedule, todo: L.gsScheduleTodo, doneLabel: L.gsScheduleDone, cta: L.gsOpenSchedule, href: "/tutor/schedule" },
    { done: hasBookings, todo: L.gsBookingTodo, doneLabel: L.gsBookingDone, cta: L.gsMyProfile, href: `/tutors/${tutorId}` },
  ];

  return (
    <Card className="mt-6 overflow-hidden border-primary/30">
      <CardContent className="bg-gradient-to-br from-primary/5 via-violet-500/5 to-sky-500/5">
        <h2 className="font-semibold">{L.gettingStarted}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{L.gsIntro}</p>
        <ol className="mt-4 space-y-2">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  s.done ? "bg-success text-success-foreground" : "border border-border bg-muted text-muted-foreground",
                )}
              >
                {s.done ? <Check size={15} strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn("flex-1 text-sm font-medium", s.done && "text-muted-foreground line-through")}>
                {s.done ? s.doneLabel : s.todo}
              </span>
              {!s.done && (
                <Link href={s.href} className="shrink-0">
                  <Button size="sm" variant="outline">{s.cta} <ArrowRight size={14} /></Button>
                </Link>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
