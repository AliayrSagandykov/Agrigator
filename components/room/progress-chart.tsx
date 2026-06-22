import type { ProgressPt } from "@/lib/types";
import { formatDelta } from "@/lib/utils";
import { getT } from "@/lib/locale";

// График траектории баллов (диагностика → пробники → офиц.). UX v3 §2.5.
// Баллы вводит тютор/ученик; систему дельты это не подменяет — это рабочая динамика.
export function ProgressChart({ points }: { points: ProgressPt[] }) {
  const t = getT();
  const SOURCE_LABEL: Record<string, string> = {
    diagnostic: t.room.srcDiagnostic,
    mock: t.room.srcMock,
    official: t.room.srcOfficial,
  };
  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.room.noProgress}</p>;
  }

  const scores = points.map((p) => p.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const W = 520;
  const H = 160;
  const padX = 28;
  const padY = 20;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;
  const x = (i: number) => (points.length === 1 ? W / 2 : padX + (i / (points.length - 1)) * innerW);
  const y = (s: number) => padY + innerH - ((s - min) / range) * innerH;
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
  const delta = points.length >= 2 ? points[points.length - 1].score - points[0].score : 0;

  return (
    <div className="space-y-3">
      {points.length >= 2 && (
        <div className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-1 text-sm font-semibold text-success">
          {formatDelta(delta)} {t.room.fromFirst}
        </div>
      )}

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full min-w-[420px]" role="img" aria-label="График прогресса">
          {/* линия */}
          <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* точки */}
          {points.map((p, i) => (
            <g key={p.id}>
              <circle cx={x(i)} cy={y(p.score)} r={4} fill="hsl(var(--primary))" />
              <text x={x(i)} y={y(p.score) - 9} textAnchor="middle" className="fill-foreground text-[11px] font-semibold">
                {p.score}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <ul className="space-y-1 text-xs text-muted-foreground">
        {points.map((p) => (
          <li key={p.id} className="flex items-center gap-2">
            <span className="font-medium text-foreground">{p.score}</span>
            <span className="rounded bg-muted px-1.5 py-0.5">{SOURCE_LABEL[p.source] ?? p.source}</span>
            {p.label && <span>{p.label}</span>}
            <span className="ml-auto tabular-nums">
              {new Date(p.takenAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
