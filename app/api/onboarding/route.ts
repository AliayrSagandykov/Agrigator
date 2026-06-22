import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { isValidTimeZone } from "@/lib/time";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const exam = String(body.exam ?? "");
  if (!exam) return NextResponse.json({ error: "Выберите экзамен" }, { status: 400 });

  const deadline = String(body.deadline ?? "flex");
  const pace = String(body.pace ?? "slow");
  const style = String(body.style ?? "soft");
  const language = getLocale(); // язык обучения = текущий язык интерфейса
  const tz = String(body.timezone ?? "");

  await query(
    `insert into "StudentGoal" ("userId", exam, deadline, pace, style, language)
     values ($1, $2, $3, $4, $5, $6)
     on conflict ("userId") do update
       set exam = excluded.exam, deadline = excluded.deadline,
           pace = excluded.pace, style = excluded.style, language = excluded.language`,
    [user.id, exam, deadline, pace, style, language],
  );

  // Часовой пояс — на User (нужен для матча и показа времени уроков).
  if (isValidTimeZone(tz)) {
    await query(`update "User" set timezone = $1 where id = $2`, [tz, user.id]);
  }

  return NextResponse.json({ ok: true });
}
