import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeTutorMetrics } from "@/lib/metrics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricStat } from "@/components/metric-stat";
import { Avatar } from "@/components/avatar";
import { CompleteLessonButton } from "@/components/complete-lesson-button";
import { formatDateTime, formatDelta, formatTenge } from "@/lib/utils";

export const metadata = { title: "Кабинет тьютора — Agrigator" };

export default async function TutorDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");
  if (user.role !== "tutor") redirect("/dashboard");

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) redirect("/tutor/onboarding");

  const now = new Date();
  const [metrics, bookings, payments] = await Promise.all([
    computeTutorMetrics(user.id),
    prisma.booking.findMany({
      where: { tutorId: user.id },
      include: { student: { select: { name: true, avatarColor: true } }, lesson: true },
      orderBy: { slotAt: "asc" },
    }),
    prisma.payment.findMany({ where: { booking: { tutorId: user.id } } }),
  ]);

  const requests = bookings.filter((b) => !b.lesson && b.slotAt >= now);
  const escrow = payments.filter((p) => p.status === "confirmed").reduce((s, p) => s + p.amount, 0);
  const released = payments.filter((p) => p.status === "released").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} photo={profile.photo} color={user.avatarColor} size={48} />
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">Кабинет тьютора</p>
          </div>
        </div>
        <Link href="/tutor/onboarding">
          <Button variant="outline"><Pencil size={15} /> Профиль</Button>
        </Link>
      </div>

      {/* Репутационный актив: 3 метрики */}
      <Card className="mt-6">
        <CardContent>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            <h2 className="font-semibold">Твой портфель результатов</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MetricStat value={formatDelta(metrics.delta)} label="средняя дельта" tone="success" />
            <MetricStat value={String(metrics.lessons)} label="уроков" />
            <MetricStat value={`${metrics.retention}%`} label="удержание" tone="primary" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Эти цифры нельзя купить — их ставит система из проведённых уроков и
            верифицированных результатов. {metrics.isLive ? "Есть живые данные." : "Показаны стартовые метрики."}
          </p>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <MetricStat value={formatTenge(escrow)} label="в эскроу" />
        <MetricStat value={formatTenge(released)} label="выплачено" />
        <MetricStat value={formatTenge(profile.price)} label="ставка за час" />
      </div>

      {/* Входящие брони */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Входящие брони</h2>
          <Link href="/tutor/inbox" className="text-sm text-primary hover:underline">Все →</Link>
        </div>
        <div className="mt-3 space-y-3">
          {requests.length === 0 && (
            <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">Новых броней нет.</CardContent></Card>
          )}
          {requests.slice(0, 5).map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={b.student.name} color={b.student.avatarColor} size={40} />
                  <div>
                    <div className="font-medium">{b.student.name}</div>
                    <div className="text-sm text-muted-foreground">{formatDateTime(b.slotAt)} · {b.kind === "trial" ? "пробный" : "урок"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={b.meetLink} target="_blank" className="text-sm text-primary hover:underline">ссылка</a>
                  <CompleteLessonButton bookingId={b.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
