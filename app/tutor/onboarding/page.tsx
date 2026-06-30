import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import type { TutorProfile } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { TutorProfileForm } from "@/components/tutor-profile-form";
import { getT } from "@/lib/locale";

export const metadata = { title: "Профиль тьютора — Agrigator" };

export default async function TutorOnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "tutor") redirect("/dashboard");

  const L = getT().tutorOnb;
  const profile = await one<TutorProfile>(`select * from "TutorProfile" where "userId" = $1`, [user.id]);

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-2xl font-bold">{L.title}</h1>
      <p className="mt-1 text-muted-foreground">{L.intro}</p>
      <Card className="mt-6">
        <CardContent>
          <TutorProfileForm
            labels={L}
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
                    calendly: profile.bookingUrl,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
