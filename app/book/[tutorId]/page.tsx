import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getTutorByUserId } from "@/lib/tutors";
import { BookingFlow } from "@/components/booking-flow";
import { Avatar } from "@/components/avatar";

export const metadata = { title: "Бронирование — Agrigator" };

// Генерим свободные слоты тютора (на проде — из Google Calendar).
function buildSlots() {
  const slots: { iso: string; label: string }[] = [];
  const times = [10, 14, 18];
  const now = new Date();
  for (let d = 1; d <= 5; d++) {
    for (const h of times) {
      const date = new Date(now);
      date.setDate(now.getDate() + d);
      date.setHours(h, 0, 0, 0);
      slots.push({
        iso: date.toISOString(),
        label: date.toLocaleString("ru-RU", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      });
    }
  }
  return slots;
}

export default async function BookPage({ params }: { params: { tutorId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login`);

  const tutor = await getTutorByUserId(params.tutorId);
  if (!tutor) notFound();

  const slots = buildSlots();

  return (
    <div className="container max-w-2xl py-10">
      <Link href={`/tutors/${tutor.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> К профилю
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <Avatar name={tutor.name} photo={tutor.photo} color={tutor.avatarColor} size={56} />
        <div>
          <h1 className="text-xl font-bold">Пробный урок с {tutor.name}</h1>
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
        />
      </div>
    </div>
  );
}
