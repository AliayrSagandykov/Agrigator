import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { AvailabilityForm } from "@/components/availability-form";
import { getT } from "@/lib/locale";

export const metadata = { title: "Расписание — Agrigator" };

export default async function TutorSchedulePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "tutor") redirect("/dashboard");

  const L = getT().tutorDash;

  const profile = await one<{ availabilityJson: string }>(
    `select "availabilityJson" from "TutorProfile" where "userId" = $1`,
    [user.id],
  );
  if (!profile) redirect("/tutor/onboarding");

  const initial = parseJson<string[]>(profile.availabilityJson, []);

  return (
    <div className="px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">{L.schedule}</h1>
        <p className="text-muted-foreground">{L.scheduleHint}</p>
        <Card className="mt-6">
          <CardContent>
            <AvailabilityForm initial={initial} labels={L} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
