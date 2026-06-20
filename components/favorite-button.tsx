"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  itemKey,
  initial,
  className,
  size = 18,
}: {
  itemKey: string;
  initial: boolean;
  className?: string;
  size?: number;
}) {
  const router = useRouter();
  const [fav, setFav] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    const res = await fetch("/api/favorites/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: itemKey }),
    });
    setLoading(false);
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setFav(data.added);
      router.refresh();
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={fav ? "Убрать из избранного" : "В избранное"}
      aria-pressed={fav}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-muted",
        className,
      )}
    >
      <Heart
        size={size}
        className={cn("transition-colors", fav ? "text-rose-500" : "text-muted-foreground")}
        fill={fav ? "currentColor" : "none"}
      />
    </button>
  );
}
