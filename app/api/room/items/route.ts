import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPairMembership } from "@/lib/pairs";

// Тютор задаёт домашку / любой из пары добавляет материал (UX v3 §2.3–2.4).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const pairId = String(body.pairId ?? "");
  const type = body.type === "homework" ? "homework" : "material";
  const title = String(body.title ?? "").trim();
  const text = String(body.body ?? "");
  const fileUrl = String(body.fileUrl ?? "");
  const dueAt = body.dueAt ? new Date(String(body.dueAt)) : null;

  if (!title && !fileUrl) return NextResponse.json({ error: "Укажите название или файл" }, { status: 400 });

  const m = await getPairMembership(pairId);
  if (!m) return NextResponse.json({ error: "Кабинет не найден" }, { status: 404 });
  const isMember = user.id === m.studentId || user.id === m.tutorId || user.role === "admin";
  if (!isMember) return NextResponse.json({ error: "Нет доступа к кабинету" }, { status: 403 });
  // Домашку задаёт только тютор.
  if (type === "homework" && user.id !== m.tutorId && user.role !== "admin")
    return NextResponse.json({ error: "Домашку задаёт тютор" }, { status: 403 });

  await query(
    `insert into "RoomItem" ("pairId",type,title,body,"fileUrl","dueAt","createdById",status)
     values ($1,$2,$3,$4,$5,$6,$7,'open')`,
    [pairId, type, title, text, fileUrl, dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null, user.id],
  );
  return NextResponse.json({ ok: true });
}
