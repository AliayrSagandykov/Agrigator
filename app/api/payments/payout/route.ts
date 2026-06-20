import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { payments } from "@/lib/payments";

// Выплата тютору из эскроу (UX §3.4). Manual: оператор раз в неделю.
// Auto: крон (app/api/cron/payouts) зовёт ту же releasePayout.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Только для оператора" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const tutorId = String(body.tutorId ?? "");
  if (!tutorId) return NextResponse.json({ error: "Не указан тютор" }, { status: 400 });

  const { released } = await payments.releasePayout({ tutorId });
  return NextResponse.json({ ok: true, released });
}
