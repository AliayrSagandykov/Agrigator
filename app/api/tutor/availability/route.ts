import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Управление доступностью тютора (UX §3.3). Слоты: "<день>-<час>", день = JS getDay() (0=Вс..6=Сб).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor")
    return NextResponse.json({ error: "Только для тьютора" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const raw: unknown[] = Array.isArray(body.slots) ? body.slots : [];
  const slots = Array.from(new Set(raw.map((s) => String(s)))).filter((s) =>
    /^[0-6]-([0-9]|1[0-9]|2[0-3])$/.test(s),
  );

  await query(`update "TutorProfile" set "availabilityJson" = $1 where "userId" = $2`, [
    JSON.stringify(slots),
    user.id,
  ]);
  return NextResponse.json({ ok: true, count: slots.length });
}
