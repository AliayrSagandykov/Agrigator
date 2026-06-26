import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  EXAM_SCALES, CADENCE_OPTIONS, HORIZON_OPTIONS, LEVEL_OPTIONS, APPROACH_OPTIONS, MAX_APPROACH,
  type Band,
} from "@/lib/onboarding-data";

const J = (v: unknown) => JSON.stringify(v);
const pickValues = (opts: { value: string }[]) => new Set(opts.map((o) => o.value));

// Матч-тест тютора: диапазоны «кому помогаю» (бэнды) + каденс/горизонт/уровни/подход.
// Хранится в TutorProfile.teachBandsJson и matchPrefsJson — питает ранжирование матча.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor")
    return NextResponse.json({ error: "Только для тьютора" }, { status: 403 });

  const body = await req.json().catch(() => ({}));

  // Бэнды — только по экзаменам с известной шкалой; from/to как есть (число или грейд).
  const rawBands = (body.bands ?? {}) as Record<string, Band>;
  const bands: Record<string, Band> = {};
  for (const [exam, b] of Object.entries(rawBands)) {
    if (!EXAM_SCALES[exam] || !b) continue;
    const scale = EXAM_SCALES[exam];
    if (scale.kind === "numeric") {
      const from = Math.max(scale.min, Math.min(scale.max, Number(b.from)));
      const to = Math.max(scale.min, Math.min(scale.max, Number(b.to)));
      if (Number.isFinite(from) && Number.isFinite(to)) bands[exam] = { from: Math.min(from, to), to: Math.max(from, to) };
    } else {
      const gi = (g: unknown) => scale.grades.indexOf(String(g));
      if (gi(b.from) >= 0 && gi(b.to) >= 0) {
        const lo = gi(b.from) <= gi(b.to) ? b.from : b.to;
        const hi = gi(b.from) <= gi(b.to) ? b.to : b.from;
        bands[exam] = { from: lo, to: hi };
      }
    }
  }

  const p = (body.prefs ?? {}) as Record<string, unknown>;
  const filt = (arr: unknown, allowed: Set<string>) =>
    Array.isArray(arr) ? arr.map(String).filter((x) => allowed.has(x)) : [];
  const prefs = {
    cadence: filt(p.cadence, pickValues(CADENCE_OPTIONS)),
    horizon: filt(p.horizon, pickValues(HORIZON_OPTIONS)),
    levels: filt(p.levels, pickValues(LEVEL_OPTIONS)),
    approach: filt(p.approach, pickValues(APPROACH_OPTIONS)).slice(0, MAX_APPROACH),
  };

  await query(
    `update "TutorProfile" set "teachBandsJson" = $1, "matchPrefsJson" = $2 where "userId" = $3`,
    [J(bands), J(prefs), user.id],
  );

  return NextResponse.json({ ok: true });
}
