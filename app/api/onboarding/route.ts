import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { isValidTimeZone } from "@/lib/time";
import { ALL_EXAMS } from "@/lib/constants";

// Санитизация мульти-ответа: только значения из allowlist; "any"/пусто = без предпочтений.
function toPrefs(v: unknown, allowed: readonly string[]): string[] {
  const list = Array.isArray(v) ? v.map(String) : [];
  const clean = list.filter((x) => allowed.includes(x));
  return clean.includes("any") ? [] : clean;
}

const ONE_OF = (v: unknown, allowed: readonly string[], fallback: string) => {
  const s = String(v ?? "");
  return allowed.includes(s) ? s : fallback;
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const exam = String(body.exam ?? "");
  if (!(ALL_EXAMS as readonly string[]).includes(exam))
    return NextResponse.json({ error: "Выберите экзамен" }, { status: 400 });

  const deadline = ONE_OF(body.deadline, ["1-2m", "3-6m", "flex"], "flex");
  const pace = ONE_OF(body.pace, ["slow", "fast", "any"], "any");
  const style = ONE_OF(body.style, ["strict", "soft", "any"], "any");
  const formats = toPrefs(body.formats, ["online", "offline", "hybrid", "any"]);
  const languages = toPrefs(body.languages, ["kk", "ru", "en", "any"]);
  const language = getLocale(); // язык интерфейса (легаси-поле)
  const tz = String(body.timezone ?? "");

  await query(
    `insert into "StudentGoal" ("userId", exam, deadline, pace, style, "formatsJson", "languagesJson", language)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict ("userId") do update
       set exam = excluded.exam, deadline = excluded.deadline,
           pace = excluded.pace, style = excluded.style,
           "formatsJson" = excluded."formatsJson",
           "languagesJson" = excluded."languagesJson",
           language = excluded.language`,
    [user.id, exam, deadline, pace, style, JSON.stringify(formats), JSON.stringify(languages), language],
  );

  // Часовой пояс — на User (нужен для матча и показа времени уроков).
  if (isValidTimeZone(tz)) {
    await query(`update "User" set timezone = $1 where id = $2`, [tz, user.id]);
  }

  return NextResponse.json({ ok: true });
}
