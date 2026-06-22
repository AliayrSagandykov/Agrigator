import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, TrendingUp, CalendarClock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { computeTutorMetrics } from "@/lib/metrics";
import { getTutorBookings, getTutorPayments } from "@/lib/queries";
import { getPairsForUser } from "@/lib/pairs";
import { PairList } from "@/components/room/pair-list";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricStat } from "@/components/metric-stat";
import { Avatar } from "@/components/avatar";
import { CompleteLessonButton } from "@/components/complete-lesson-button";
import { formatDateTime, formatDelta, formatTenge } from "@/lib/utils";
import { getT } from "@/lib/locale";

export const metadata = { title: "Кабинет тьютора — Agrigator" };

export default async function TutorDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");
  if (user.role !== "tutor") redirect("/dashboard");

  const profile = await one<{ photo: string | null; price: number }>(
    `select photo, price from "TutorProfile" where "userId" = $1`,
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

  const requests = bookings.filter((b) => !b.hasLesson && b.slotAt >= now);
  const escrow = payments.filter((p) => p.status === "confirmed").reduce((s, p) => s + p.amount, 0);
  const released = payments.filter((p) => p.status === "released").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} photo={profile.photo} color={user.avatarColor} size={48} />
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">{L.tutorCabinet}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/tutor/schedule">
            <Button variant="outline"><CalendarClock size={15} /> {L.schedule}</Button>
          </Link>
          <Link href="/tutor/onboarding">
            <Button variant="outline"><Pencil size={15} /> {L.profile}</Button>
          </Link>
        </div>
      </div>

      {/* Репутационный актив: 3 метрики */}
      <Card className="mt-6">
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

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <MetricStat value={formatTenge(escrow)} label={L.escrow} />
        <MetricStat value={formatTenge(released)} label={L.paidOut} />
        <MetricStat value={formatTenge(profile.price)} label={L.hourlyRate} />
      </div>

      {/* Кабинеты учеников — центр удержания */}
      {pairs.length > 0 && (
        <section className="mt-8">
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
                  <a href={b.meetLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{L.link}</a>
                  <CompleteLessonButton bookingId={b.id} labels={L} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
