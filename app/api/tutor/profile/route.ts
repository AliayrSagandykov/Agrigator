import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const J = (v: unknown) => JSON.stringify(v);
const toList = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.map(String)
    : String(v ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

// Онбординг/правка профиля тютора (UX §3.1). Метрики (дельта/удержание)
// тут НЕ задаются — их считает система из Result/Lesson.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor")
    return NextResponse.json({ error: "Только для тьютора" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const subjects = toList(body.subjects);
  const exams = toList(body.exams);
  const price = Math.max(0, parseInt(body.price, 10) || 0);
  const format = ["online", "offline", "hybrid"].includes(body.format) ? body.format : "online";
  const city = String(body.city ?? "Онлайн");
  const experience = Math.max(0, parseInt(body.experience, 10) || 0);
  const bio = String(body.bio ?? "");
  const methodology = String(body.methodology ?? "");
  const trialFree = body.trialFree !== false;

  if (exams.length === 0) return NextResponse.json({ error: "Укажите хотя бы один экзамен" }, { status: 400 });
  if (price <= 0) return NextResponse.json({ error: "Укажите цену за час" }, { status: 400 });

  await query(
    `insert into "TutorProfile"
       ("userId","subjectsJson","examsJson",price,format,city,experience,bio,methodology,"trialFree",verified)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)
     on conflict ("userId") do update set
       "subjectsJson" = excluded."subjectsJson",
       "examsJson"    = excluded."examsJson",
       price          = excluded.price,
       format         = excluded.format,
       city           = excluded.city,
       experience     = excluded.experience,
       bio            = excluded.bio,
       methodology    = excluded.methodology,
       "trialFree"    = excluded."trialFree"`,
    [user.id, J(subjects), J(exams), price, format, city, experience, bio, methodology, trialFree],
  );

  return NextResponse.json({ ok: true });
}
