import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { query, one } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Базовое управление карточками тьюторов: тогглы и удаление.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Только для оператора" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId ?? "");
  const action = String(body.action ?? "");

  const exists = await one(`select id from "User" where id = $1 and role = 'tutor'`, [userId]);
  if (!exists) return NextResponse.json({ error: "Тьютор не найден" }, { status: 404 });

  if (action === "toggleSponsored") {
    await query(`update "TutorProfile" set sponsored = not sponsored where "userId" = $1`, [userId]);
  } else if (action === "toggleVerified") {
    await query(`update "TutorProfile" set "aiVerified" = not "aiVerified" where "userId" = $1`, [userId]);
  } else if (action === "delete") {
    await query(`delete from "User" where id = $1`, [userId]); // каскад удалит профиль/брони
  } else {
    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }

  revalidateTag("tutors"); // сбросить кэш витрины тюторов
  return NextResponse.json({ ok: true });
}
