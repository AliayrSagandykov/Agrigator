import { NextResponse } from "next/server";
import { query, one } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Студент задаёт baseline — официальный прошлый балл (или из диагностики).
// Без него прогресс не считается в цифрах (UX §2.2, §5).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const score = String(body.score ?? "").trim();
  const source = body.source === "diagnostic" ? "diagnostic" : "official";
  if (!score || !Number.isFinite(Number(score)))
    return NextResponse.json({ error: "Укажите числовой балл" }, { status: 400 });

  const goal = await one(`select id from "StudentGoal" where "userId" = $1`, [user.id]);
  if (!goal) return NextResponse.json({ error: "Сначала пройдите подбор" }, { status: 400 });

  await query(
    `update "StudentGoal" set "baselineScore" = $1, "baselineSource" = $2 where "userId" = $3`,
    [score, source, user.id],
  );
  return NextResponse.json({ ok: true });
}
