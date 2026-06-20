import { NextResponse } from "next/server";
import crypto from "crypto";
import { one, query, withTransaction } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { parseJson } from "@/lib/utils";
import type { Lead } from "@/lib/types";

const J = (v: unknown) => JSON.stringify(v);

// Импорт лида в карточку тютора / отклонение (UX-парсер объявлений).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Только для оператора" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");
  const action = String(body.action ?? "");

  const lead = await one<Lead>(`select * from "Lead" where id = $1`, [id]);
  if (!lead) return NextResponse.json({ error: "Лид не найден" }, { status: 404 });

  if (action === "reject") {
    await query(`update "Lead" set status = 'rejected' where id = $1`, [id]);
    return NextResponse.json({ ok: true });
  }

  if (action === "import") {
    if (lead.status === "imported")
      return NextResponse.json({ error: "Уже импортирован" }, { status: 409 });

    const parsed = parseJson<Record<string, unknown>>(lead.parsedJson, {});
    const name = String(parsed.title ?? `${lead.source} лид`);
    const exam = parsed.exam ? [String(parsed.exam)] : [];
    const price = Math.max(0, Number(parsed.price) || 0) || 5000;
    const format = ["online", "offline", "hybrid"].includes(String(parsed.format))
      ? String(parsed.format)
      : "online";
    const contacts = {
      instagram: parsed.instagram ? String(parsed.instagram) : undefined,
      telegram: parsed.telegram ? String(parsed.telegram) : undefined,
      phone: parsed.phone ? String(parsed.phone) : undefined,
    };
    const email = `lead-${crypto.randomBytes(4).toString("hex")}@import.agrigator.kz`;

    await withTransaction(async (c) => {
      const res = await c.query(
        `insert into "User" (role, name, email, "passwordHash") values ('tutor', $1, $2, $3) returning id`,
        [name, email, hashPassword(crypto.randomBytes(8).toString("hex"))],
      );
      const userId = res.rows[0].id as string;
      await c.query(
        `insert into "TutorProfile" ("userId","subjectsJson","examsJson",price,format,city,"contactsJson",source,verified,"aiVerified")
         values ($1,$2,$3,$4,$5,'Онлайн',$6,'parser',false,false)`,
        [userId, J([name]), J(exam), price, format, J(contacts)],
      );
    });

    await query(`update "Lead" set status = 'imported' where id = $1`, [id]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
