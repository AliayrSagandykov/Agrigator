import Link from "next/link";
import { BadgeCheck, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { DeltaChart } from "@/components/delta-chart";
import { FavoriteButton } from "@/components/favorite-button";
import { formatPrice } from "@/lib/utils";
import { getT } from "@/lib/locale";
import type { TutorVM } from "@/lib/tutors";

export function TutorCard({
  tutor,
  matchPercent,
  reasons,
  isFav = false,
}: {
  tutor: TutorVM;
  matchPercent?: number;
  reasons?: string[];
  isFav?: boolean;
}) {
  const t = getT();
  const lowData = tutor.metrics.sample < 10;

  // Ссылка — оверлей на всю карточку; сердце лежит выше неё (z-10), поэтому
  // его клик не ведёт на профиль (без вложенных интерактивных элементов).
  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/tutors/${tutor.id}`} className="absolute inset-0" aria-label={tutor.name}>
        <span className="sr-only">{tutor.name}</span>
      </Link>
      <FavoriteButton itemKey={`tutor:${tutor.id}`} initial={isFav} className="absolute right-3 top-3 z-10" />

      <div className="flex items-start gap-3 pr-9">
        <Avatar name={tutor.name} photo={tutor.photo} color={tutor.avatarColor} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold">{tutor.name}</h3>
            {tutor.aiVerified && <ShieldCheck className="shrink-0 text-success" size={16} />}
          </div>
          <p className="truncate text-sm text-muted-foreground">{tutor.subjects}</p>
          {tutor.sponsored && (
            <Badge variant="accent" className="mt-1">
              <Sparkles size={11} /> {t.card.ad}
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-4">
        {lowData ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3 text-center text-sm text-muted-foreground">
            {t.card.newTutor}
          </div>
        ) : (
          <DeltaChart
            metric={tutor.metrics.metric}
            before={tutor.metrics.before}
            after={tutor.metrics.after}
            sample={tutor.metrics.sample}
            compact
          />
        )}
      </div>

      {!lowData && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="success">
            <BadgeCheck size={12} /> {tutor.metrics.sample} {t.card.verifiedStudents}
          </Badge>
          <Badge variant="secondary">{t.card.retention} {tutor.metrics.retention}%</Badge>
        </div>
      )}

      {matchPercent != null && (
        <div className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          <span className="font-semibold">{matchPercent}% {t.card.match}</span>
          {reasons && reasons.length > 0 && <span> · {reasons.join(", ")}</span>}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="font-semibold">{formatPrice(tutor.price, tutor.priceUnit)}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock size={13} /> {tutor.responseTime}
        </span>
      </div>
    </div>
  );
}
