import { NextResponse } from "next/server";
import { query, one } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Верификация дельты. Manual: оператор читает report и вводит финальный балл.
// Auto (фаза 2): парсинг PDF. delta = finalScore − baseline считает СИСТЕМА.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Только для оператора" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const resultId = String(body.resultId ?? "");
  const finalScore = Number(body.finalScore);
  const baselineOverride = body.baseline != null ? Number(body.baseline) : null;

  if (!resultId || !Number.isFinite(finalScore))
    return NextResponse.json({ error: "Нужен финальный балл" }, { status: 400 });

  const result = await one<{ baseline: number | null }>(
    `select baseline from "Result" where id = $1`,
    [resultId],
  );
  if (!result) return NextResponse.json({ error: "Результат не найден" }, { status: 404 });

  const baseline = baselineOverride ?? result.baseline ?? 0;
  const delta = Math.round((finalScore - baseline) * 10) / 10;

  await query(
    `update "Result"
       set "finalScore" = $1, baseline = $2, delta = $3, status = 'delta_set', "verifiedAt" = now()
     where id = $4`,
    [finalScore, baseline, delta, resultId],
  );

  return NextResponse.json({ ok: true, delta });
}
