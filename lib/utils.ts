import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Безопасный разбор JSON-строкового поля (subjectsJson и т.п.). */
export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function formatPrice(value: number, unit = "час"): string {
  return `${value.toLocaleString("ru-RU")} ₸/${unit}`;
}

const FORMAT_LABELS: Record<string, string> = {
  online: "Онлайн",
  offline: "Оффлайн",
  hybrid: "Гибрид",
};

export function formatLabel(value: string): string {
  return FORMAT_LABELS[value] ?? value;
}

export function formatTenge(value: number): string {
  return `${value.toLocaleString("ru-RU")} ₸`;
}

/** Округлённая дельта со знаком: +1.4 / −0.2 */
export function formatDelta(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${Math.abs(rounded)}`;
}

export function formatDateTime(d: Date | string, timeZone?: string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  };
  try {
    // Без timeZone используется зона сервера (на Vercel — UTC), поэтому
    // в местах, где знаем пояс зрителя, передаём его явно.
    return date.toLocaleString("ru-RU", timeZone ? { ...opts, timeZone } : opts);
  } catch {
    return date.toLocaleString("ru-RU", opts);
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
