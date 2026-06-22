import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getTutorBookings, getReviewedBookingIds } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/avatar";
import { CompleteLessonButton } from "@/components/complete-lesson-button";
import { StudentTapReview } from "@/components/student-tap-review";
import { BookingRespondButtons } from "@/components/booking-respond-buttons";
import { formatDateTime } from "@/lib/utils";
import { getT } from "@/lib/locale";

export const metadata = { title: "Входящие — Agrigator" };

export default async function TutorInbox() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "tutor") redirect("/dashboard");

  const L = getT().tutorDash;
  const tz = user.timezone ?? undefined;
  const [bookings, reviewed] = await Promise.all([
    getTutorBookings(user.id),
    getReviewedBookingIds(user.id),
  ]);

  return (
    <div className="container max-w-3xl py-10">
      <Link href="/tutor" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> {L.toCabinet}
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{L.incomingBookings}</h1>
      <p className="text-muted-foreground">{L.inboxHint}</p>

      <div className="mt-6 space-y-3">
        {bookings.length === 0 && <p className="text-sm text-muted-foreground">{L.noBookings}</p>}
        {bookings.map((b) => (
          <Card key={b.id}>
            <CardContent className="space-y-3 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={b.student.name} color={b.student.avatarColor} size={40} />
                  <div>
                    <div className="font-medium">{b.student.name}</div>
                    <div className="text-sm text-muted-foreground">{formatDateTime(b.slotAt, tz)} · {b.kind === "trial" ? L.trial : L.lesson}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {b.hasLesson ? (
                    <Badge variant="success">{L.held}</Badge>
                  ) : b.status === "cancelled" ? (
                    <Badge variant="secondary">{L.declined}</Badge>
                  ) : !b.acceptedAt ? (
                    <Badge variant="outline">{L.awaitingResp}</Badge>
                  ) : (
                    <>
                      <a href={b.meetLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{L.link}</a>
                      <CompleteLessonButton bookingId={b.id} labels={L} />
                    </>
                  )}
                </div>
              </div>
              {!b.hasLesson && b.status !== "cancelled" && !b.acceptedAt && (
                <div className="border-t border-border pt-3">
                  <BookingRespondButtons bookingId={b.id} labels={L} />
                </div>
              )}
              {b.hasLesson && !reviewed.has(b.id) && (
                <div className="border-t border-border pt-3">
                  <div className="mb-2 text-xs text-muted-foreground">{L.studentQuestion}</div>
                  <StudentTapReview bookingId={b.id} studentName={b.student.name} labels={L} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
