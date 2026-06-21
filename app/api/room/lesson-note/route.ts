import { NextResponse } from "next/server";
import { query, one } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Тютор отмечает тему урока в один тап (UX v3 §2.2).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const lessonId = String(body.lessonId ?? "");
  const topic = String(body.topic ?? "").trim().slice(0, 300);

  const lesson = await one<{ tutorId: string }>(`select "tutorId" from "Lesson" where id = $1`, [lessonId]);
  if (!lesson) return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
  if (user.id !== lesson.tutorId && user.role !== "admin")
    return NextResponse.json({ error: "Отмечает тютор" }, { status: 403 });

  await query(`update "Lesson" set topic = $1 where id = $2`, [topic, lessonId]);
  return NextResponse.json({ ok: true });
}
