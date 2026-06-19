import Link from "next/link";
import { BadgeCheck, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { DeltaChart } from "@/components/delta-chart";
import { formatPrice } from "@/lib/utils";
import type { TutorVM } from "@/lib/tutors";

export function TutorCard({
  tutor,
  matchPercent,
  reasons,
}: {
  tutor: TutorVM;
  matchPercent?: number;
  reasons?: string[];
}) {
  const lowData = tutor.metrics.sample < 10;

  return (
    <Link
      href={`/tutors/${tutor.id}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <Avatar name={tutor.name} photo={tutor.photo} color={tutor.avatarColor} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold">{tutor.name}</h3>
            {tutor.aiVerified && <ShieldCheck className="shrink-0 text-success" size={16} />}
          </div>
          <p className="truncate text-sm text-muted-foreground">{tutor.subjects}</p>
        </div>
        {tutor.sponsored && (
          <Badge variant="accent" className="shrink-0">
            <Sparkles size={11} /> Реклама
          </Badge>
        )}
      </div>

      <div className="mt-4">
        {lowData ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3 text-center text-sm text-muted-foreground">
            🌱 Новый тютор, мало уроков — метрики пока копятся
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
            <BadgeCheck size={12} /> {tutor.metrics.sample} верифиц. учеников
          </Badge>
          <Badge variant="secondary">удержание {tutor.metrics.retention}%</Badge>
        </div>
      )}

      {matchPercent != null && (
        <div className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          <span className="font-semibold">{matchPercent}% совпадение</span>
          {reasons && reasons.length > 0 && <span> · {reasons.join(", ")}</span>}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="font-semibold">{formatPrice(tutor.price, tutor.priceUnit)}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock size={13} /> {tutor.responseTime}
        </span>
      </div>
    </Link>
  );
}
