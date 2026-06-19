import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notifyOperator } from "@/lib/notify";

// Студент загружает официальный score report. Baseline — из цели/диагностики.
// Дельту student НЕ вводит — её проставит верификация (оператор → авто-парсинг).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const tutorId = String(body.tutorId ?? "");
  const exam = String(body.exam ?? "");
  const reportUrl = String(body.reportUrl ?? "");
  if (!tutorId || !exam)
    return NextResponse.json({ error: "Укажите тютора и экзамен" }, { status: 400 });

  const goal = await one<{ baselineScore: string | null }>(
    `select "baselineScore" from "StudentGoal" where "userId" = $1`,
    [user.id],
  );
  const baselineNum = goal?.baselineScore ? Number(goal.baselineScore) : null;
  const baseline = Number.isFinite(baselineNum) ? baselineNum : null;

  const result = await one<{ id: string }>(
    `insert into "Result" ("studentId","tutorId",exam,baseline,"reportUrl",status)
     values ($1,$2,$3,$4,$5,'submitted') returning id`,
    [user.id, tutorId, exam, baseline, reportUrl],
  );

  await notifyOperator({ type: "result_submitted", resultId: result!.id, studentName: user.name });
  return NextResponse.json({ ok: true, resultId: result!.id });
}
