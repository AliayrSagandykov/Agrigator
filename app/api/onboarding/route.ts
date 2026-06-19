import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const exam = String(body.exam ?? "");
  if (!exam) return NextResponse.json({ error: "Выберите экзамен" }, { status: 400 });

  const deadline = String(body.deadline ?? "flex");
  const pace = String(body.pace ?? "slow");
  const style = String(body.style ?? "soft");

  await query(
    `insert into "StudentGoal" ("userId", exam, deadline, pace, style)
     values ($1, $2, $3, $4, $5)
     on conflict ("userId") do update
       set exam = excluded.exam, deadline = excluded.deadline,
           pace = excluded.pace, style = excluded.style`,
    [user.id, exam, deadline, pace, style],
  );

  return NextResponse.json({ ok: true });
}
