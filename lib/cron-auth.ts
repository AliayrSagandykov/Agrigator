import "server-only";

// Vercel Cron шлёт `Authorization: Bearer <CRON_SECRET>`, если задан CRON_SECRET.
// Если секрет не задан (dev) — пускаем. В проде задай CRON_SECRET.
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  const url = new URL(req.url);
  return auth === `Bearer ${secret}` || url.searchParams.get("key") === secret;
}
