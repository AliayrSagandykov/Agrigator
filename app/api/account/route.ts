import { NextResponse } from "next/server";
import { query, one } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// Правка профиля пользователя: имя, email, цвет аватара.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const avatarColor = String(body.avatarColor ?? "").trim();

  if (!name) return NextResponse.json({ error: "name" }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "email" }, { status: 400 });

  // email должен быть уникален (кроме самого пользователя).
  const taken = await one<{ id: string }>(
    `select id from "User" where email = $1 and id <> $2`,
    [email, user.id],
  );
  if (taken) return NextResponse.json({ error: "taken" }, { status: 409 });

  const color = HEX_RE.test(avatarColor) ? avatarColor : user.avatarColor;

  // Фото: ресайзнутый data:-URL (или http-URL хранилища), либо null для удаления.
  // photo не передан в body → оставляем как есть.
  let photo = user.photo;
  if ("photo" in body) {
    const p = body.photo;
    if (p == null || p === "") {
      photo = null;
    } else if (
      typeof p === "string" &&
      // только растровые data-URL (без svg → защита от XSS через SVG) либо https-ссылка
      /^(data:image\/(png|jpe?g|webp|gif|avif);base64,|https:\/\/)/.test(p) &&
      p.length <= 700_000
    ) {
      photo = p;
    } else {
      return NextResponse.json({ error: "photo" }, { status: 400 });
    }
  }

  await query(
    `update "User" set name = $1, email = $2, "avatarColor" = $3, photo = $4 where id = $5`,
    [name, email, color, photo, user.id],
  );

  return NextResponse.json({ ok: true });
}
