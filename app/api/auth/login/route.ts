import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession, toPublicUser } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").toLowerCase().trim();
  const password = String(body.password ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  if (!verifyPassword(password, user.passwordHash))
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });

  await createSession(user.id);
  return NextResponse.json({ user: toPublicUser(user) });
}
