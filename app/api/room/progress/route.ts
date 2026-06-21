import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPairMembership } from "@/lib/pairs";

// Точка прогресса (балл пробника). Система строит график; дельту не правят.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const pairId = String(body.pairId ?? "");
  const source = ["diagnostic", "mock", "official"].includes(body.source) ? body.source : "mock";
  const score = Number(body.score);
  const label = String(body.label ?? "");
  if (!Number.isFinite(score)) return NextResponse.json({ error: "Укажите балл" }, { status: 400 });

  const m = await getPairMembership(pairId);
  if (!m) return NextResponse.json({ error: "Кабинет не найден" }, { status: 404 });
  if (user.id !== m.studentId && user.id !== m.tutorId && user.role !== "admin")
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  await query(
    `insert into "ProgressPt" ("pairId",source,score,label) values ($1,$2,$3,$4)`,
    [pairId, source, score, label],
  );
  return NextResponse.json({ ok: true });
}
