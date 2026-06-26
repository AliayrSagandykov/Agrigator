import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { isValidTimeZone } from "@/lib/time";
import { APPROACH_OPTIONS, STUDENT_CADENCE_OPTIONS, MAX_STUDENT_APPROACH } from "@/lib/onboarding-data";

const J = (v: unknown) => JSON.stringify(v);

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

  // Стартовый уровень → baseline (питает прогресс). Пусто = не трогаем существующий.
  const startRaw = String(body.startScore ?? "").trim();
  const startScore = startRaw && Number.isFinite(Number(startRaw)) ? startRaw : null;

  const targetRaw = String(body.targetScore ?? "").trim();
  const targetScore = targetRaw || null;

  const cadenceAllowed = new Set(STUDENT_CADENCE_OPTIONS.map((o) => o.value));
  const cadence = cadenceAllowed.has(String(body.cadence)) ? String(body.cadence) : null;

  const approachAllowed = new Set(APPROACH_OPTIONS.map((o) => o.value));
  const approach = (Array.isArray(body.approach) ? body.approach.map(String) : [])
    .filter((a: string) => approachAllowed.has(a))
    .slice(0, MAX_STUDENT_APPROACH);

  await query(
    `insert into "StudentGoal"
       ("userId", exam, deadline, pace, style, language,
        "baselineScore", "baselineSource", "targetScore", cadence, "approachJson")
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     on conflict ("userId") do update set
       exam = excluded.exam, deadline = excluded.deadline,
       pace = excluded.pace, style = excluded.style, language = excluded.language,
       "baselineScore"  = coalesce(excluded."baselineScore", "StudentGoal"."baselineScore"),
       "baselineSource" = coalesce(excluded."baselineSource", "StudentGoal"."baselineSource"),
       "targetScore"    = excluded."targetScore",
       cadence          = excluded.cadence,
       "approachJson"   = excluded."approachJson"`,
    [user.id, exam, deadline, pace, style, language,
     startScore, startScore ? "intake" : null, targetScore, cadence, J(approach)],
  );

  // Часовой пояс — на User (нужен для матча и показа времени уроков).
  const tz = String(body.timezone ?? "");
  if (isValidTimeZone(tz)) {
    await query(`update "User" set timezone = $1 where id = $2`, [tz, user.id]);
  }

  return NextResponse.json({ ok: true });
}
