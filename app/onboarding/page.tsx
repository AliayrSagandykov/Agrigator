import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { IntakeWizard } from "@/components/intake-wizard";

export const metadata = { title: "Подбор тютора — Agrigator" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/register?role=student");
  if (user.role === "tutor") redirect("/tutor");

  return (
    <div className="container py-12">
      <IntakeWizard />
    </div>
  );
}
