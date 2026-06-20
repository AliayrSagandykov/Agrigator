import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { getClientQuestions } from "@/lib/diagnostic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DiagnosticWizard } from "@/components/diagnostic-wizard";

export const metadata = { title: "Диагностика — Agrigator" };

export default async function DiagnosticPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/register?role=student");
  if (user.role === "tutor") redirect("/tutor");

  const goal = await one<{ exam: string }>(`select exam from "StudentGoal" where "userId" = $1`, [user.id]);
  if (!goal) redirect("/onboarding");

  const questions = getClientQuestions(goal.exam);

  return (
    <div className="container max-w-lg py-12">
      {questions ? (
        <DiagnosticWizard exam={goal.exam} questions={questions} />
      ) : (
        <Card>
          <CardContent className="text-center">
            <div className="text-4xl">🧪</div>
            <h1 className="mt-3 text-xl font-bold">Диагностика для {goal.exam} скоро</h1>
            <p className="mt-2 text-muted-foreground">
              Пока укажи стартовый балл вручную в кабинете — прогресс будет в цифрах.
            </p>
            <Link href="/dashboard" className="mt-5 inline-block">
              <Button>В кабинет</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
