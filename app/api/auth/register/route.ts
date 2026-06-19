import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession, toPublicUser } from "@/lib/auth";

const AVATAR_COLORS = ["#7c3aed", "#0ea5e9", "#16a34a", "#f59e0b", "#ef4444", "#ec4899"];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").toLowerCase().trim();
  const password = String(body.password ?? "");
  const role = body.role === "tutor" ? "tutor" : "student";
  const phone = body.phone ? String(body.phone).trim() : null;
  const parentPhone = body.parentPhone ? String(body.parentPhone).trim() : null;
  const isMinor = Boolean(body.isMinor);

  if (!name) return NextResponse.json({ error: "Укажите имя" }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ error: "Некорректный email" }, { status: 400 });
  if (password.length < 6)
    return NextResponse.json({ error: "Пароль — минимум 6 символов" }, { status: 400 });
  // Закон РК о перс. данных: ученику <18 нужен контакт родителя.
  if (role === "student" && isMinor && !parentPhone)
    return NextResponse.json({ error: "Для учеников младше 18 нужен номер родителя" }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Этот email уже зарегистрирован" }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role,
      phone,
      parentPhone,
      passwordHash: hashPassword(password),
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    },
  });

  await createSession(user.id);
  return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
}
