import { NextResponse } from "next/server";
import { query, one } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { scoreAnswers } from "@/lib/diagnostic";

// Студент прошёл диагностику → система сама считает baseline и пишет его.
// Студент число не вводит (UX §2.2, §5).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const answers: number[] = Array.isArray(body.answers) ? body.answers.map((a: unknown) => Number(a)) : [];

  const goal = await one<{ exam: string }>(`select exam from "StudentGoal" where "userId" = $1`, [user.id]);
  if (!goal) return NextResponse.json({ error: "Сначала пройдите подбор" }, { status: 400 });

  const result = scoreAnswers(goal.exam, answers);
  if (!result) return NextResponse.json({ error: "Диагностика недоступна для этого экзамена" }, { status: 400 });

  await query(
    `update "StudentGoal" set "baselineScore" = $1, "baselineSource" = 'diagnostic' where "userId" = $2`,
    [String(result.baseline), user.id],
  );

  return NextResponse.json({ ok: true, ...result });
}
