import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const exam = String(body.exam ?? "");
  if (!exam) return NextResponse.json({ error: "Выберите экзамен" }, { status: 400 });

  const data = {
    exam,
    deadline: String(body.deadline ?? "flex"),
    pace: String(body.pace ?? "slow"),
    style: String(body.style ?? "soft"),
  };

  await prisma.studentGoal.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true });
}
