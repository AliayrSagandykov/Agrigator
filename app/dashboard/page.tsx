import Link from "next/link";
import { redirect } from "next/navigation";
import { Video, Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { one, query } from "@/lib/db";
import { computeStudentProgress } from "@/lib/metrics";
import { getStudentBookings, getReviewedBookingIds } from "@/lib/queries";
import { getPairsForUser } from "@/lib/pairs";
import { PairList } from "@/components/room/pair-list";
import { LessonReview } from "@/components/lesson-review";
import { BaselineForm } from "@/components/baseline-form";
import type { StudentGoal } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { DeltaChart } from "@/components/delta-chart";
import { ResultUpload } from "@/components/result-upload";
import { RetentionQuestion } from "@/components/retention-question";
import { formatDateTime, formatDelta } from "@/lib/utils";

export const metadata = { title: "Кабинет — Agrigator" };

export default async function StudentDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "tutor") redirect("/tutor");
  if (user.role === "admin") redirect("/admin");

  const now = new Date();
  const [bookings, goal, progress, retentionSignals, reviewed, pairs] = await Promise.all([
    getStudentBookings(user.id),
    one<StudentGoal>(`select * from "StudentGoal" where "userId" = $1`, [user.id]),
    computeStudentProgress(user.id),
    query<{ tutorId: string }>(`select "tutorId" from "RetentionSignal" where "studentId" = $1`, [user.id]),
    getReviewedBookingIds(user.id),
    getPairsForUser(user.id),
  ]);

  const upcoming = bookings.filter((b) => b.slotAt >= now && !b.hasLesson && b.status !== "cancelled");
  const history = bookings.filter((b) => b.hasLesson);

  // Тюторы, с кем были уроки (для загрузки результата).
  const workedWith = Array.from(
    new Map(history.map((b) => [b.tutor.id, { id: b.tutor.id, name: b.tutor.name }])).values(),
  );

  // Ретеншн-вопрос: был урок, нет будущей брони, ответ ещё не давали.
  const answered = new Set(retentionSignals.map((s) => s.tutorId));
  const hasUpcoming = new Set(upcoming.map((b) => b.tutor.id));
  const retentionTarget = history
    .map((b) => b.tutor)
    .find((t) => !answered.has(t.id) && !hasUpcoming.has(t.id));

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Привет, {user.name.split(" ")[0]}</h1>
          {goal && <p className="text-muted-foreground">Цель: {goal.exam}</p>}
        </div>
        <Link href="/catalog">
          <Button variant="outline"><Plus size={16} /> Найти тютора</Button>
        </Link>
      </div>

      {retentionTarget && (
        <div className="mt-6">
          <RetentionQuestion tutorId={retentionTarget.id} tutorName={retentionTarget.name} />
        </div>
      )}

      {pairs.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-semibold">Кабинеты с тьюторами</h2>
          <PairList pairs={pairs} tz={user.timezone ?? undefined} />
        </section>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Прогресс */}
        <Card>
          <CardContent>
            <h2 className="font-semibold">Прогресс</h2>
            {progress.hasBaseline && progress.latest != null ? (
              <div className="mt-3">
                <DeltaChart metric={progress.exam ?? "Балл"} before={progress.baseline!} after={progress.latest} />
              </div>
            ) : progress.hasBaseline ? (
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Baseline</span><span className="font-medium">{progress.baseline}</span></div>
                <p className="text-muted-foreground">Сдашь экзамен — загрузи отчёт, и система посчитает дельту.</p>
              </div>
            ) : (
              <div className="mt-3">
                <Link
                  href="/diagnostic"
                  className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  🎯 Пройти диагностику
                </Link>
                <div className="mt-3 text-xs text-muted-foreground">или укажи прошлый официальный балл:</div>
                <BaselineForm exam={progress.exam} />
              </div>
            )}
            {progress.delta != null && (
              <div className="mt-3">
                <Badge variant="success">{formatDelta(progress.delta)} к результату</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Загрузка результата */}
        <Card>
          <CardContent>
            <h2 className="font-semibold">Загрузить результат</h2>
            <p className="mb-3 mt-1 text-sm text-muted-foreground">Официальный score report после экзамена.</p>
            <ResultUpload tutors={workedWith} defaultExam={goal?.exam} />
          </CardContent>
        </Card>
      </div>

      {/* Ближайшие уроки */}
      <section className="mt-8">
        <h2 className="font-semibold">Ближайшие уроки</h2>
        <div className="mt-3 space-y-3">
          {upcoming.length === 0 && (
            <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">
              Нет запланированных уроков. <Link href="/catalog" className="text-primary hover:underline">Забронировать</Link>
            </CardContent></Card>
          )}
          {upcoming.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={b.tutor.name} color={b.tutor.avatarColor} size={40} />
                  <div>
                    <div className="font-medium">{b.tutor.name}</div>
                    <div className="text-sm text-muted-foreground">{formatDateTime(b.slotAt, user.timezone ?? undefined)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {b.acceptedAt ? (
                    <Badge variant="success">подтверждён</Badge>
                  ) : (
                    <Badge variant="outline">ждёт тютора</Badge>
                  )}
                  <PaymentBadge status={b.paymentStatus ?? undefined} />
                  <a href={b.meetLink} target="_blank" rel="noopener noreferrer">
                    <Button size="sm"><Video size={15} /> Войти</Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* История + перебронь (главный путь удержания) */}
      <section className="mt-8">
        <h2 className="font-semibold">История</h2>
        <div className="mt-3 space-y-3">
          {history.length === 0 && <p className="text-sm text-muted-foreground">Пока пусто.</p>}
          {history.map((b) => (
            <Card key={b.id}>
              <CardContent className="space-y-3 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={b.tutor.name} color={b.tutor.avatarColor} size={40} />
                    <div>
                      <div className="font-medium">{b.tutor.name}</div>
                      <div className="text-sm text-muted-foreground">Урок {formatDateTime(b.slotAt, user.timezone ?? undefined)}</div>
                    </div>
                  </div>
                  <Link href={`/book/${b.tutor.id}`}>
                    <Button size="sm" variant="outline">Забронировать ещё</Button>
                  </Link>
                </div>
                {!reviewed.has(b.id) && <LessonReview bookingId={b.id} tutorName={b.tutor.name} />}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function PaymentBadge({ status }: { status?: string }) {
  if (!status) return <Badge variant="secondary">бесплатно</Badge>;
  if (status === "confirmed" || status === "released")
    return <Badge variant="success">оплачено</Badge>;
  return <Badge variant="secondary">ожидает оплаты</Badge>;
}
