import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { releaseEarnedPayouts } from "@/lib/jobs";

// Никогда не кэшировать и не выполнять на билде (мутирующий эндпоинт).
export const dynamic = "force-dynamic";

// Vercel Cron (еженедельно). Авто-выплата эскроу по проведённым урокам.
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const released = await releaseEarnedPayouts();
  return NextResponse.json({ ok: true, released });
}
