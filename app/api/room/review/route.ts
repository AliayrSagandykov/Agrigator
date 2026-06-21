import { NextResponse } from "next/server";
import { query, one } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPairMembership } from "@/lib/pairs";

// Тютор проверяет домашку: комментарий + закрытие (UX v3 §2.4).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const homeworkId = String(body.homeworkId ?? "");
  const reviewNote = String(body.reviewNote ?? "");

  const hw = await one<{ pairId: string }>(
    `select "pairId" from "RoomItem" where id = $1 and type = 'homework'`,
    [homeworkId],
  );
  if (!hw) return NextResponse.json({ error: "Домашка не найдена" }, { status: 404 });
  const m = await getPairMembership(hw.pairId);
  if (!m || (user.id !== m.tutorId && user.role !== "admin"))
    return NextResponse.json({ error: "Проверяет тютор" }, { status: 403 });

  await query(
    `update "Submission" set "reviewState" = 'reviewed', "reviewNote" = $1
     where id = (select id from "Submission" where "homeworkId" = $2 order by "submittedAt" desc limit 1)`,
    [reviewNote, homeworkId],
  );
  await query(`update "RoomItem" set status = 'done' where id = $1`, [homeworkId]);
  return NextResponse.json({ ok: true });
}
