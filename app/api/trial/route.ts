import { NextResponse } from "next/server";
import { query, one } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notifyOperator } from "@/lib/notify";

// Трекинг пробного через Calendly:
//  action 'open'      — студент открыл виджет (но мог и не записаться);
//  action 'scheduled' — Calendly прислал событие «записался» → это реальная бронь.
// Так мы отличаем «зашёл и вышел» от «реально забронировал».
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "student")
    return NextResponse.json({ error: "Только для ученика" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const tutorId = String(body.tutorId ?? "");
  const action = body.action === "scheduled" ? "scheduled" : "open";

  // Тьютор должен существовать и иметь подключённый Calendly.
  const tutor = await one<{ name: string; bookingUrl: string }>(
    `select u.name, p."bookingUrl"
     from "User" u join "TutorProfile" p on p."userId" = u.id
     where u.id = $1 and u.role = 'tutor'`,
    [tutorId],
  );
  if (!tutor || !tutor.bookingUrl)
    return NextResponse.json({ error: "Тьютор не найден" }, { status: 404 });

  if (action === "scheduled") {
    const eventUri = String(body.eventUri ?? "").slice(0, 500);
    await query(
      `insert into "TrialRequest" ("studentId","tutorId",status,"eventUri","scheduledAt")
       values ($1,$2,'scheduled',$3,now())
       on conflict ("studentId","tutorId") do update set
         status = 'scheduled', "eventUri" = excluded."eventUri", "scheduledAt" = now()`,
      [user.id, tutorId, eventUri],
    );
    await notifyOperator({ type: "trial_scheduled", studentName: user.name, tutorName: tutor.name });
  } else {
    // «Открыл»: не понижаем статус, если уже была реальная запись.
    await query(
      `insert into "TrialRequest" ("studentId","tutorId",status)
       values ($1,$2,'opened')
       on conflict ("studentId","tutorId") do update set
         status = case when "TrialRequest".status = 'scheduled' then 'scheduled' else 'opened' end,
         "openedAt" = now()`,
      [user.id, tutorId],
    );
  }

  return NextResponse.json({ ok: true });
}
