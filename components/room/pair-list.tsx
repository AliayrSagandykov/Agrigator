import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PairCard } from "@/lib/pairs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

// Карточки кабинетов пар для дашбордов (ведут в /room/[id]). tz — пояс зрителя.
export function PairList({ pairs, tz }: { pairs: PairCard[]; tz?: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {pairs.map((p) => (
        <Link key={p.id} href={`/room/${p.id}`} className="group">
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-3 py-3">
              <Avatar name={p.visavi.name} color={p.visavi.avatarColor} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{p.visavi.name}</span>
                  {p.subject && <Badge variant="secondary">{p.subject}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.nextSlotAt ? `следующий урок ${formatDateTime(p.nextSlotAt, tz)}` : "нет запланированных уроков"}
                </div>
              </div>
              <ArrowRight size={16} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
