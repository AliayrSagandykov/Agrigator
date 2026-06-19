import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getTutorBookings } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { CompleteLessonButton } from "@/components/complete-lesson-button";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Входящие — Agrigator" };

export default async function TutorInbox() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "tutor") redirect("/dashboard");

  const bookings = await getTutorBookings(user.id);

  return (
    <div className="container max-w-3xl py-10">
      <Link href="/tutor" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> В кабинет
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Входящие брони</h1>
      <p className="text-muted-foreground">
        Принятая бронь = слот и ссылка уже созданы. Логистику система берёт на себя.
      </p>

      <div className="mt-6 space-y-3">
        {bookings.length === 0 && <p className="text-sm text-muted-foreground">Броней пока нет.</p>}
        {bookings.map((b) => (
          <Card key={b.id}>
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-3">
                <Avatar name={b.student.name} color={b.student.avatarColor} size={40} />
                <div>
                  <div className="font-medium">{b.student.name}</div>
                  <div className="text-sm text-muted-foreground">{formatDateTime(b.slotAt)} · {b.kind === "trial" ? "пробный" : "урок"}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {b.hasLesson ? (
                  <Badge variant="success">проведён</Badge>
                ) : (
                  <>
                    <a href={b.meetLink} target="_blank" className="text-sm text-primary hover:underline">ссылка</a>
                    <CompleteLessonButton bookingId={b.id} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
