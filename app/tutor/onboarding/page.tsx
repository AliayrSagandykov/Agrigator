import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TutorProfileForm } from "@/components/tutor-profile-form";

export const metadata = { title: "Профиль тьютора — Agrigator" };

export default async function TutorOnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "tutor") redirect("/dashboard");

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-2xl font-bold">Профиль тьютора</h1>
      <p className="mt-1 text-muted-foreground">
        Регистрация бесплатна навсегда. Это твой портфель результатов — он растёт сам и его
        нельзя купить.
      </p>
      <Card className="mt-6">
        <CardContent>
          <TutorProfileForm
            initial={
              profile
                ? {
                    subjects: parseJson<string[]>(profile.subjectsJson, []).join(", "),
                    exams: parseJson<string[]>(profile.examsJson, []).join(", "),
                    price: profile.price,
                    format: profile.format,
                    city: profile.city,
                    experience: profile.experience,
                    bio: profile.bio,
                    methodology: profile.methodology,
                    trialFree: profile.trialFree,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
