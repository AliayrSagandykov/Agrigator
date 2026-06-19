import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notifyOperator } from "@/lib/notify";

// Студент загружает официальный score report. Baseline берётся из цели/диагностики.
// Дельту student НЕ вводит — её проставит верификация (оператор → потом авто-парсинг).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const tutorId = String(body.tutorId ?? "");
  const exam = String(body.exam ?? "");
  const reportUrl = String(body.reportUrl ?? "");
  if (!tutorId || !exam)
    return NextResponse.json({ error: "Укажите тютора и экзамен" }, { status: 400 });

  const goal = await prisma.studentGoal.findUnique({ where: { userId: user.id } });
  const baseline = goal?.baselineScore ? Number(goal.baselineScore) : null;

  const result = await prisma.result.create({
    data: {
      studentId: user.id,
      tutorId,
      exam,
      baseline: Number.isFinite(baseline) ? baseline : null,
      reportUrl,
      status: "submitted",
    },
  });

  await notifyOperator({ type: "result_submitted", resultId: result.id, studentName: user.name });
  return NextResponse.json({ ok: true, resultId: result.id });
}
