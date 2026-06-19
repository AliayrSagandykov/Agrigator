import { cn } from "@/lib/utils";

// Три ядровые метрики тютора: дельта · уроки · удержание.
export function MetricStat({
  value,
  label,
  hint,
  tone = "default",
  className,
}: {
  value: string;
  label: string;
  hint?: string;
  tone?: "default" | "primary" | "success";
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-background p-3 text-center", className)}>
      <div
        className={cn(
          "text-2xl font-bold tabular-nums",
          tone === "primary" && "text-primary",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground/70">{hint}</div>}
    </div>
  );
}

export function MetricRow({
  delta,
  lessons,
  retention,
  isLive,
}: {
  delta: string;
  lessons: number | string;
  retention: number | string;
  isLive?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <MetricStat value={delta} label="средняя дельта" tone="success" />
      <MetricStat value={String(lessons)} label="уроков" />
      <MetricStat value={`${retention}%`} label="удержание" tone="primary" />
    </div>
  );
}
