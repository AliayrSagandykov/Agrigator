import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteTutors } from "@/lib/tutors";
import { TutorCard } from "@/components/tutor-card";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/locale";

export const metadata = { title: "Избранное — Agrigator" };

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const L = getT().favorites;
  const tutors = await getFavoriteTutors(user.id);

  return (
    <div className="container py-10">
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <Heart className="text-rose-500" fill="currentColor" /> {L.title}
      </h1>
      <p className="mt-1 text-muted-foreground">{L.sub}</p>

      {tutors.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">{L.empty}</p>
          <Link href="/catalog" className="mt-4 inline-block">
            <Button>{L.toTutors}</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tutors.map((t) => (
            <TutorCard key={t.id} tutor={t} isFav />
          ))}
        </div>
      )}
    </div>
  );
}
