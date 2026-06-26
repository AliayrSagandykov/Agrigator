import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import type { TutorProfile } from "@/lib/types";
import { TutorOnboardingWizard, type TutorOnbInitial } from "@/components/tutor-onboarding-wizard";
import { getT } from "@/lib/locale";

export const metadata = { title: "Профиль тьютора — Agrigator" };

export default async function TutorOnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "tutor") redirect("/dashboard");

  const profile = await one<TutorProfile>(`select * from "TutorProfile" where "userId" = $1`, [user.id]);

  const initial: TutorOnbInitial | undefined = profile
    ? {
        exams: parseJson<string[]>(profile.examsJson, []),
        subjects: parseJson<string[]>(profile.subjectsJson, []),
        price: profile.price,
        experience: profile.experience,
        format: profile.format,
        city: profile.city,
        bio: profile.bio,
        methodology: profile.methodology,
        trialFree: profile.trialFree,
      }
    : undefined;

  // После сохранения: новичку — матч-тест, тому кто его прошёл — обратно в кабинет.
  const prefs = parseJson<Record<string, string[]>>(profile?.matchPrefsJson ?? "{}", {});
  const matchDone = Object.values(prefs).some((a) => Array.isArray(a) && a.length > 0);
  const nextHref = matchDone ? "/tutor" : "/tutor/match";

  return (
    <div className="px-5 py-10 sm:px-8">
      <TutorOnboardingWizard initial={initial} nextHref={nextHref} labels={getT().tutorWizard} />
    </div>
  );
}
