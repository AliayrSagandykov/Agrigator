import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { AvailabilityForm } from "@/components/availability-form";

export const metadata = { title: "Расписание — Agrigator" };

export default async function TutorSchedulePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "tutor") redirect("/dashboard");

  const profile = await one<{ availabilityJson: string }>(
    `select "availabilityJson" from "TutorProfile" where "userId" = $1`,
    [user.id],
  );
  if (!profile) redirect("/tutor/onboarding");

  const initial = parseJson<string[]>(profile.availabilityJson, []);

  return (
    <div className="container max-w-2xl py-10">
      <Link href="/tutor" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> В кабинет
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Расписание</h1>
      <p className="text-muted-foreground">
        Отметь свободные часы — ученики увидят именно эти слоты при бронировании.
        Пусто = показываем стандартные слоты.
      </p>
      <Card className="mt-6">
        <CardContent>
          <AvailabilityForm initial={initial} />
        </CardContent>
      </Card>
    </div>
  );
}
