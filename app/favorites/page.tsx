import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteTutors } from "@/lib/tutors";
import { TutorCard } from "@/components/tutor-card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Избранное — Agrigator" };

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tutors = await getFavoriteTutors(user.id);

  return (
    <div className="container py-10">
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <Heart className="text-rose-500" fill="currentColor" /> Избранное
      </h1>
      <p className="mt-1 text-muted-foreground">Тюторы, которых ты сохранил.</p>

      {tutors.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">Пока пусто. Жми ❤️ на карточках тюторов.</p>
          <Link href="/catalog" className="mt-4 inline-block">
            <Button>К тюторам</Button>
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
