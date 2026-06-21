import { NextResponse } from "next/server";
import { query, one } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPairMembership } from "@/lib/pairs";

// Ученик сдаёт домашку (UX v3 §2.4).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const homeworkId = String(body.homeworkId ?? "");
  const fileUrl = String(body.fileUrl ?? "");
  const text = String(body.body ?? "");
  if (!fileUrl && !text) return NextResponse.json({ error: "Прикрепите файл или текст" }, { status: 400 });

  const hw = await one<{ pairId: string }>(
    `select "pairId" from "RoomItem" where id = $1 and type = 'homework'`,
    [homeworkId],
  );
  if (!hw) return NextResponse.json({ error: "Домашка не найдена" }, { status: 404 });
  const m = await getPairMembership(hw.pairId);
  if (!m || (user.id !== m.studentId && user.role !== "admin"))
    return NextResponse.json({ error: "Сдаёт ученик пары" }, { status: 403 });

  await query(
    `insert into "Submission" ("homeworkId","studentId","fileUrl",body) values ($1,$2,$3,$4)`,
    [homeworkId, m.studentId, fileUrl, text],
  );
  await query(`update "RoomItem" set status = 'submitted' where id = $1`, [homeworkId]);
  return NextResponse.json({ ok: true });
}
