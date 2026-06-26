import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import type { TutorProfile } from "@/lib/types";
import { TutorMatchWizard } from "@/components/tutor-match-wizard";
import type { Band, MatchPrefs } from "@/lib/onboarding-data";
import { EMPTY_PREFS } from "@/lib/onboarding-data";
import { getT } from "@/lib/locale";

export const metadata = { title: "Матч-тест тьютора — Agrigator" };

export default async function TutorMatchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "tutor") redirect("/dashboard");

  const profile = await one<TutorProfile>(`select * from "TutorProfile" where "userId" = $1`, [user.id]);
  if (!profile) redirect("/tutor/onboarding");

  const L = getT().tutorWizard;
  const exams = parseJson<string[]>(profile.examsJson, []);
  const initialBands = parseJson<Record<string, Band>>(profile.teachBandsJson, {});
  const initialPrefs = parseJson<MatchPrefs>(profile.matchPrefsJson, EMPTY_PREFS);

  return (
    <div className="px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              ✨ {L.matchBadge}
            </div>
            <h1 className="mt-2 text-3xl font-bold">{L.matchTitle}</h1>
            <p className="mt-1 text-muted-foreground">{L.matchIntro}</p>
          </div>
          <Link href="/tutor" className="shrink-0 pt-1 text-sm text-muted-foreground hover:text-foreground">
            {L.matchSkip}
          </Link>
        </div>
        <TutorMatchWizard exams={exams} initialBands={initialBands} initialPrefs={initialPrefs} labels={L} />
      </div>
    </div>
  );
}
