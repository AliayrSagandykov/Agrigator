// ============================================================
// Часовые пояса (UX v3 §5): смещение, совместимость для матча, подписи.
// Клиент-безопасно (Intl есть и на сервере, и в браузере). DST берётся
// на момент расчёта — для планирования уроков этого достаточно.
// ============================================================

/** Смещение зоны от UTC в минутах (на момент `at`). */
export function tzOffsetMinutes(timeZone: string, at: Date = new Date()): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const p: Record<string, string> = {};
    for (const part of dtf.formatToParts(at)) p[part.type] = part.value;
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return Math.round((asUTC - at.getTime()) / 60000);
  } catch {
    return 0;
  }
}

/** Короткая подпись пояса: GMT+5, GMT−3:30. */
export function shortTzLabel(timeZone: string | null | undefined): string {
  if (!timeZone) return "";
  const off = tzOffsetMinutes(timeZone);
  const sign = off >= 0 ? "+" : "−";
  const h = Math.floor(Math.abs(off) / 60);
  const m = Math.abs(off) % 60;
  return `GMT${sign}${h}${m ? ":" + String(m).padStart(2, "0") : ""}`;
}

/** Город из IANA-имени для UI: "Asia/Almaty" → "Almaty". */
export function tzCity(timeZone: string | null | undefined): string {
  if (!timeZone) return "";
  const tail = timeZone.split("/").pop() ?? timeZone;
  return tail.replace(/_/g, " ");
}

/**
 * Совместимость двух поясов для онлайн-уроков (0..1).
 * Совпадение/≤2ч → 1; ≥10ч → 0; неизвестно → нейтральные 0.6.
 */
export function tzCompatibility(a?: string | null, b?: string | null): number {
  if (!a || !b) return 0.6;
  const diffH = Math.abs(tzOffsetMinutes(a) - tzOffsetMinutes(b)) / 60;
  if (diffH <= 2) return 1;
  if (diffH >= 10) return 0;
  return Math.max(0, 1 - (diffH - 2) / 8);
}

/** Безопасная проверка IANA-имени (некорректное в Intl бросает исключение). */
export function isValidTimeZone(tz: string): boolean {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
