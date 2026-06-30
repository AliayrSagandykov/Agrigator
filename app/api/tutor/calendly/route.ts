import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Быстрое сохранение Calendly-ссылки тьютора прямо из дашборда (без полной формы).
// Ссылка хранится в "TutorProfile"."bookingUrl".
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor")
    return NextResponse.json({ error: "Только для тьютора" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const raw = String(body.calendly ?? "").trim();

  // Пусто = убрать ссылку; иначе только валидный https-URL (клик студента безопасен).
  let bookingUrl = "";
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "https:") throw new Error("scheme");
      bookingUrl = u.toString();
    } catch {
      return NextResponse.json(
        { error: "Ссылка должна быть валидным https-адресом" },
        { status: 400 },
      );
    }
  }

  await query(`update "TutorProfile" set "bookingUrl" = $1 where "userId" = $2`, [bookingUrl, user.id]);
  revalidateTag("tutors"); // витрина тьютора закэширована — сбросить
  return NextResponse.json({ ok: true });
}
