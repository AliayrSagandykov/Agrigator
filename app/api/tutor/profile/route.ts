import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

  if (exams.length === 0) return NextResponse.json({ error: "Укажите хотя бы один экзамен" }, { status: 400 });
  if (price <= 0) return NextResponse.json({ error: "Укажите цену за час" }, { status: 400 });

  const data = {
    subjectsJson: J(subjects),
    examsJson: J(exams),
    price,
    format: ["online", "offline", "hybrid"].includes(body.format) ? body.format : "online",
    city: String(body.city ?? "Онлайн"),
    experience: Math.max(0, parseInt(body.experience, 10) || 0),
    bio: String(body.bio ?? ""),
    methodology: String(body.methodology ?? ""),
    trialFree: body.trialFree !== false,
  };

  await prisma.tutorProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, verified: true, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true });
}
