import { NextResponse } from "next/server";
import { query, one } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Тоггл избранного. key = "tutor:<id>" | "course:<id>".
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const key = String(body.key ?? "");
  if (!/^(tutor|course):[\w-]+$/.test(key))
    return NextResponse.json({ error: "Некорректный ключ" }, { status: 400 });

  const existing = await one(`select id from "Favorite" where "userId" = $1 and key = $2`, [user.id, key]);
  if (existing) {
    await query(`delete from "Favorite" where "userId" = $1 and key = $2`, [user.id, key]);
    return NextResponse.json({ added: false, key });
  }
  await query(`insert into "Favorite" ("userId", key) values ($1, $2)`, [user.id, key]);
  return NextResponse.json({ added: true, key });
}
