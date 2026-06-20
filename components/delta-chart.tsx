import { cn } from "@/lib/utils";
import { formatDelta } from "@/lib/utils";
import { getT } from "@/lib/locale";

// Верифицированный график «до/после» — единственная «магия» продукта.
// Цифры ставит система, не тютор.
export function DeltaChart({
  metric,
  before,
  after,
  sample,
  className,
  compact = false,
}: {
  metric: string;
  before: number;
  after: number;
  sample?: number;
  className?: string;
  compact?: boolean;
}) {
  const t = getT();
  const max = Math.max(before, after, 1);
  const beforePct = Math.round((before / max) * 100);
  const afterPct = Math.round((after / max) * 100);
  const delta = after - before;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">{metric}</span>
        {sample != null && <span>{t.chart.sample}: {sample} {t.chart.students}</span>}
      </div>

      <Bar label={t.chart.before} pct={beforePct} value={before} tone="muted" />
      <Bar label={t.chart.after} pct={afterPct} value={after} tone="primary" />

      {!compact && (
        <div className="pt-1">
          <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-1 text-sm font-semibold text-success">
            {formatDelta(delta)} {t.chart.toResult}
          </span>
        </div>
      )}
    </div>
  );
}

function Bar({
  label,
  pct,
  value,
  tone,
}: {
  label: string;
  pct: number;
  value: number;
  tone: "muted" | "primary";
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            tone === "primary" ? "bg-primary" : "bg-muted-foreground/40",
          )}
          style={{ width: `${Math.max(pct, 6)}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
        {value}
      </span>
    </div>
  );
}
