"use client";
import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { EXAM_SCALES, normalizeLevel, type Band, type ChoiceOption } from "@/lib/onboarding-data";

// ============================================================
// Примитивы плавного онбординга: выбор вместо ручного ввода.
// Чипы-пилюли, сегмент-контрол, слайдеры, бэнд-пикер, выбор города.
// ============================================================

// ── Прогресс шагов ─────────────────────────────────────────
export function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-all",
            i < step ? "bg-primary" : i === step ? "bg-primary/60" : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}

// ── Чип-мультиселект (пилюли) ──────────────────────────────
export function ChipSelect({
  options,
  selected,
  onChange,
  max,
  size = "md",
  single = false,
}: {
  options: ChoiceOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
  size?: "sm" | "md";
  single?: boolean;
}) {
  const atMax = !single && max != null && selected.length >= max;
  const toggle = (v: string) => {
    if (single) return onChange(selected.includes(v) ? [] : [v]);
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
    else if (!atMax) onChange([...selected, v]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o.value);
        const disabled = !on && atMax;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            disabled={disabled}
            aria-pressed={on}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all",
              size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm",
              on
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card hover:border-primary/50 hover:bg-accent",
              disabled && "cursor-not-allowed opacity-40 hover:border-border hover:bg-card",
            )}
          >
            {o.emoji && <span className="text-base leading-none">{o.emoji}</span>}
            {o.label}
            {on && <Check size={14} strokeWidth={3} className="ml-0.5" />}
          </button>
        );
      })}
    </div>
  );
}

// ── Сегмент-контрол (одиночный выбор) ──────────────────────
export function Segmented({
  options,
  value,
  onChange,
}: {
  options: ChoiceOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            value === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.emoji && <span className="leading-none">{o.emoji}</span>}
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Слайдер одиночного значения (цена / опыт) ──────────────
export function Slider({
  min,
  max,
  step,
  value,
  onChange,
  format,
  presets,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  presets?: number[];
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-3 text-center text-3xl font-bold tabular-nums">
        {format ? format(value) : value}
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="agr-range w-full"
          style={{ "--pct": `${pct}%` } as React.CSSProperties}
        />
      </div>
      {presets && (
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                value === p ? "border-primary bg-accent text-accent-foreground" : "border-border hover:bg-muted",
              )}
            >
              {format ? format(p) : p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Бэнд-пикер: диапазон «кому могу помогать» по экзамену ───
export function BandPicker({
  exam,
  band,
  onChange,
}: {
  exam: string;
  band: Band;
  onChange: (b: Band) => void;
}) {
  const scale = EXAM_SCALES[exam];
  if (!scale) return null;

  if (scale.kind === "ordinal") {
    const grades = scale.grades;
    const fromIdx = grades.indexOf(String(band.from));
    const toIdx = grades.indexOf(String(band.to));
    const fromOpts: ChoiceOption[] = grades.map((g) => ({ value: g, label: g }));
    return (
      <div className="space-y-3">
        <BandTrack a={normalizeLevel(exam, band.from)} b={normalizeLevel(exam, band.to)} from={String(band.from)} to={String(band.to)} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">От</div>
            <Segmented options={fromOpts} value={String(band.from)} onChange={(v) => {
              const ni = grades.indexOf(v);
              onChange({ from: v, to: ni > toIdx ? v : band.to });
            }} />
          </div>
          <div>
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">До</div>
            <Segmented options={fromOpts} value={String(band.to)} onChange={(v) => {
              const ni = grades.indexOf(v);
              onChange({ to: v, from: ni < fromIdx ? v : band.from });
            }} />
          </div>
        </div>
      </div>
    );
  }

  const { min, max, step } = scale;
  const from = Number(band.from);
  const to = Number(band.to);
  return (
    <div className="space-y-3">
      <BandTrack a={normalizeLevel(exam, from)} b={normalizeLevel(exam, to)} from={from} to={to} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1 flex justify-between text-xs font-medium text-muted-foreground">
            <span>От</span><span className="tabular-nums text-foreground">{from}</span>
          </div>
          <input
            type="range" min={min} max={max} step={step} value={from}
            onChange={(e) => { const v = Math.min(Number(e.target.value), to); onChange({ from: v, to }); }}
            className="agr-range w-full"
            style={{ "--pct": `${((from - min) / (max - min)) * 100}%` } as React.CSSProperties}
          />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs font-medium text-muted-foreground">
            <span>До</span><span className="tabular-nums text-foreground">{to}</span>
          </div>
          <input
            type="range" min={min} max={max} step={step} value={to}
            onChange={(e) => { const v = Math.max(Number(e.target.value), from); onChange({ from, to: v }); }}
            className="agr-range w-full"
            style={{ "--pct": `${((to - min) / (max - min)) * 100}%` } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
}

// ── Пикер одного уровня (текущий / целевой балл) ───────────
export function LevelPicker({
  exam,
  value,
  onChange,
}: {
  exam: string;
  value: number | string;
  onChange: (v: number | string) => void;
}) {
  const scale = EXAM_SCALES[exam];
  if (!scale) return null;
  if (scale.kind === "ordinal") {
    return (
      <Segmented
        options={scale.grades.map((g) => ({ value: g, label: g }))}
        value={String(value)}
        onChange={(v) => onChange(v)}
      />
    );
  }
  return (
    <Slider
      min={scale.min} max={scale.max} step={scale.step}
      value={Number(value)} onChange={(v) => onChange(v)}
    />
  );
}

function BandTrack({ a, b, from, to }: { a: number; b: number; from: number | string; to: number | string }) {
  const left = Math.min(a, b) * 100;
  const width = Math.abs(b - a) * 100;
  return (
    <div className="relative h-9 rounded-lg bg-muted">
      <div
        className="absolute top-0 h-full rounded-lg bg-gradient-to-r from-primary to-violet-500 opacity-80"
        style={{ left: `${left}%`, width: `${Math.max(width, 4)}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground mix-blend-luminosity">
        {from} → {to}
      </div>
    </div>
  );
}

// ── Выбор города с поиском ─────────────────────────────────
export function CitySelect({
  cities,
  value,
  onChange,
}: {
  cities: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return cities;
    return cities.filter((c) => c.toLowerCase().includes(t));
  }, [q, cities]);

  return (
    <div>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Найти город…"
          className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {filtered.map((c) => {
          const on = value === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all",
                on ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card hover:border-primary/50 hover:bg-accent",
              )}
            >
              {c === "Онлайн" && <span>💻</span>}
              {c}
              {on && <Check size={14} strokeWidth={3} />}
            </button>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">Ничего не найдено</p>}
      </div>
    </div>
  );
}
