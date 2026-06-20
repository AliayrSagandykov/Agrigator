import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { getTutorCards } from "@/lib/tutors";
import type { StudentGoal } from "@/lib/types";
import { rankTutors } from "@/lib/match";
import { TutorCard } from "@/components/tutor-card";
import { DEADLINE_LABEL, PACE_LABEL, STYLE_LABEL } from "@/lib/constants";

export const metadata = { title: "Подходящие тюторы — Agrigator" };

export default async function MatchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/register?role=student");

  const goal = await one<StudentGoal>(`select * from "StudentGoal" where "userId" = $1`, [user.id]);
  if (!goal) redirect("/onboarding");

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
    })),
    { exam: goal.exam, deadline: goal.deadline, pace: goal.pace, style: goal.style },
  );

  const byId = new Map(tutors.map((t) => [t.id, t]));
  const top = ranked.slice(0, 5);

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold">Тюторы под твою цель</h1>
      <p className="mt-1 text-muted-foreground">
        {goal.exam} · {DEADLINE_LABEL[goal.deadline]} · {PACE_LABEL[goal.pace]} · {STYLE_LABEL[goal.style]} ·{" "}
        <Link href="/onboarding" className="text-primary hover:underline">изменить</Link>
      </p>

      {/* Скипабельный оффер диагностики (UX §2.2) */}
      {!goal.baselineScore && (
        <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-xl border border-primary/30 bg-accent p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 text-primary" size={18} />
            <div>
              <div className="font-medium text-accent-foreground">Хочешь точный график прогресса?</div>
              <p className="text-sm text-accent-foreground/80">
                Поставь baseline — короткой диагностикой или прошлым официальным баллом. Тогда дельта посчитается в цифрах.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/diagnostic"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Пройти диагностику
            </Link>
            <Link href="/dashboard" className="text-sm text-accent-foreground/70 hover:underline">
              Позже
            </Link>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {top.map((r) => {
          const tutor = byId.get(r.id);
          if (!tutor) return null;
          return <TutorCard key={r.id} tutor={tutor} matchPercent={r.percent} reasons={r.reasons} />;
        })}
      </div>
    </div>
  );
}
