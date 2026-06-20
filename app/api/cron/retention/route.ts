import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { scanRetention } from "@/lib/jobs";

// Никогда не кэшировать и не выполнять на билде.
export const dynamic = "force-dynamic";

// Vercel Cron (ежедневно). «Нет переброни N дней» → триггер ретеншн-вопроса.
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const due = await scanRetention();
  return NextResponse.json({ ok: true, due });
}
