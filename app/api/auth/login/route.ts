import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { verifyPassword, createSession, toPublicUser } from "@/lib/auth";
import type { User } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").toLowerCase().trim();
  const password = String(body.password ?? "");

  const user = await one<User>(`select * from "User" where email = $1`, [email]);
  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  if (!verifyPassword(password, user.passwordHash))
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });

  await createSession(user.id);
  return NextResponse.json({ user: toPublicUser(user) });
}
