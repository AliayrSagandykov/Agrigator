import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Ретеншн-микровопрос (UX §2.10): отличает «ушёл, потому что сдал» от
// «ушёл, потому что не подошёл». Чинит главный конфаундер удержания.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const tutorId = String(body.tutorId ?? "");
  const reason = String(body.reason ?? "");
  const allowed = ["pause", "goal_reached", "not_fit", "expensive"];
  if (!tutorId || !allowed.includes(reason))
    return NextResponse.json({ error: "Некорректный ответ" }, { status: 400 });

  await query(
    `insert into "RetentionSignal" ("studentId","tutorId",reason) values ($1,$2,$3)`,
    [user.id, tutorId, reason],
  );
  return NextResponse.json({ ok: true });
}
