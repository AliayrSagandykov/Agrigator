import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import { getTutorByUserId } from "@/lib/tutors";
import { BookingFlow } from "@/components/booking-flow";
import { Avatar } from "@/components/avatar";
import { getT } from "@/lib/locale";

export const metadata = { title: "Бронирование — Agrigator" };

const ALL_TIMES = [10, 12, 14, 16, 18, 20];
const fmt = (d: Date) =>
  d.toLocaleString("ru-RU", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Слоты из доступности тютора (день = getDay()); если пусто — стандартные.
function buildSlots(availability: string[]) {
  const now = new Date();
  const out: { iso: string; label: string }[] = [];

  if (availability.length) {
    const avail = new Set(availability);
    for (let i = 0; i <= 14 && out.length < 18; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      for (const h of ALL_TIMES) {
        if (!avail.has(`${date.getDay()}-${h}`)) continue;
        const slot = new Date(date);
        slot.setHours(h, 0, 0, 0);
        if (slot > now) out.push({ iso: slot.toISOString(), label: fmt(slot) });
      }
    }
    if (out.length) return out;
  }

  // fallback: стандартные слоты
  for (let d = 1; d <= 5; d++) {
    for (const h of [10, 14, 18]) {
      const date = new Date(now);
      date.setDate(now.getDate() + d);
      date.setHours(h, 0, 0, 0);
      out.push({ iso: date.toISOString(), label: fmt(date) });
    }
  }
  return out;
}

export default async function BookPage({ params }: { params: { tutorId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login`);

  const tutor = await getTutorByUserId(params.tutorId);
  if (!tutor) notFound();

  const avail = await one<{ availabilityJson: string }>(
    `select "availabilityJson" from "TutorProfile" where "userId" = $1`,
    [params.tutorId],
  );
  const slots = buildSlots(parseJson<string[]>(avail?.availabilityJson, []));
  const L = getT().booking;

  return (
    <div className="container max-w-2xl py-10">
      <Link href={`/tutors/${tutor.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> {L.toProfile}
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <Avatar name={tutor.name} photo={tutor.photo} color={tutor.avatarColor} size={56} />
        <div>
          <h1 className="text-xl font-bold">{L.trialWithPre}{tutor.name}</h1>
          <p className="text-sm text-muted-foreground">{tutor.subjects}</p>
        </div>
      </div>

      <div className="mt-6">
        <BookingFlow
          tutorId={tutor.id}
          tutorName={tutor.name}
          price={tutor.price}
          trialFree={tutor.trialFree}
          slots={slots}
          labels={L}
        />
      </div>
    </div>
  );
}
