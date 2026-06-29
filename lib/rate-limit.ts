import "server-only";

// ============================================================
// Простой in-memory rate limiter (fixed window) для защиты auth-роутов
// от брутфорса/перебора. ВНИМАНИЕ: память процесса — на нескольких
// serverless-инстансах не общий. Для прод-масштаба заменить на Upstash/Redis
// (общий счётчик), интерфейс оставить тем же.
// ============================================================

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export interface RateResult {
  ok: boolean;
  retryAfter: number; // секунды до сброса окна
}

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();

  // Лёгкая профилактика утечки памяти: иногда подчищаем протухшие окна.
  if (store.size > 5000) {
    for (const [k, b] of store) if (b.resetAt < now) store.delete(k);
  }

  const b = store.get(key);
  if (!b || b.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count++;
  if (b.count > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfter: 0 };
}

/** IP клиента из заголовков прокси (Vercel/Render ставят x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || "unknown";
}
