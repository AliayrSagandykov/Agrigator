import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPairMembership } from "@/lib/pairs";

// Лёгкий контекстный чат пары (UX v3 §2.6).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const pairId = String(body.pairId ?? "");
  const text = String(body.body ?? "").trim().slice(0, 2000);
  if (!text) return NextResponse.json({ error: "Пустое сообщение" }, { status: 400 });

  const m = await getPairMembership(pairId);
  if (!m) return NextResponse.json({ error: "Кабинет не найден" }, { status: 404 });
  if (user.id !== m.studentId && user.id !== m.tutorId && user.role !== "admin")
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  await query(`insert into "Message" ("pairId","authorId",body) values ($1,$2,$3)`, [pairId, user.id, text]);
  return NextResponse.json({ ok: true });
}
