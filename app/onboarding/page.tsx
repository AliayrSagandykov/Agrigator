import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import type { StudentGoal } from "@/lib/types";
import { IntakeWizard, type IntakeInitial } from "@/components/intake-wizard";
import { getT } from "@/lib/locale";

export const metadata = { title: "Подбор тютора — Agrigator" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/register?role=student");
  if (user.role === "tutor") redirect("/tutor");

  // Уже заполнял подбор — пред-заполняем визард, чтобы не начинать с нуля.
  const goal = await one<StudentGoal>(`select * from "StudentGoal" where "userId" = $1`, [user.id]);
  const initial: IntakeInitial | undefined = goal
    ? {
        exam: goal.exam,
        startScore: goal.baselineScore,
        targetScore: goal.targetScore,
        deadline: goal.deadline,
        cadence: goal.cadence,
        approach: parseJson<string[]>(goal.approachJson, []),
      }
    : undefined;

  return (
    <div className="container py-12">
      <IntakeWizard initial={initial} labels={getT().intake} />
    </div>
  );
}
