// ============================================================
// Применить SQL-миграции к Postgres/Supabase (кроссплатформенно, без psql).
//
//   npm run db:migrate           — БЕЗОПАСНО: применяет только новые миграции,
//                                  не трогает данные. Можно гонять на боевой базе.
//   npm run db:migrate -- --fresh — дроп всех таблиц и применить с нуля (локальный
//                                  сброс; используется в db:reset).
//
// Учёт применённого — в таблице "_migration". Существующая база «бейзлайнится»:
// миграции, чьи объекты уже есть (ошибка «already exists»), помечаются как
// применённые без изменений. Так новые колонки (0004/0005) доезжают на живую
// базу без потери данных.
// ============================================================
import { Client } from "pg";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const proc = process as unknown as { loadEnvFile?: (path?: string) => void };
if (!process.env.DATABASE_URL) {
  try { proc.loadEnvFile?.(".env.local"); } catch {}
  try { proc.loadEnvFile?.(".env"); } catch {}
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL не задан (положи его в .env.local).");
  process.exit(1);
}
const isLocal = /localhost|127\.0\.0\.1/.test(url);
const FRESH = process.argv.includes("--fresh");

const TABLES = [
  "Consent", "Message", "ProgressPt", "Submission", "RoomItem", "Pair",
  "RetentionSignal", "Review", "Result", "Lesson", "Payment", "Booking",
  "StudentGoal", "Favorite", "Session", "TutorProfile", "Course", "Lead", "User",
];

// SQLSTATE-коды «объект уже существует» — значит миграция фактически уже применена.
const ALREADY_EXISTS = new Set(["42P07", "42710", "42701", "42P06", "42723", "42P16", "42P04"]);

async function main() {
  const client = new Client({ connectionString: url, ssl: isLocal ? false : { rejectUnauthorized: false } });
  await client.connect();

  if (FRESH) {
    console.log("🧹 --fresh: дроп таблиц…");
    await client.query(`drop table if exists ${TABLES.map((t) => `"${t}"`).join(", ")} cascade`);
    await client.query(`drop table if exists "_migration" cascade`);
  }

  await client.query(
    `create table if not exists "_migration" (name text primary key, "appliedAt" timestamptz not null default now())`,
  );
  const applied = new Set(
    (await client.query<{ name: string }>(`select name from "_migration"`)).rows.map((r) => r.name),
  );

  const dir = join(process.cwd(), "supabase", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  let ran = 0, baselined = 0, skipped = 0;
  for (const f of files) {
    if (applied.has(f)) { skipped++; continue; }
    const sql = readFileSync(join(dir, f), "utf8");
    try {
      await client.query(sql);
      console.log("▶︎ применил", f);
      ran++;
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code && ALREADY_EXISTS.has(code)) {
        console.log("↷ уже в базе, отмечаю как применённую (baseline):", f);
        baselined++;
      } else {
        console.error("✗ ошибка в", f);
        throw e;
      }
    }
    await client.query(`insert into "_migration"(name) values ($1) on conflict do nothing`, [f]);
  }

  console.log(`✅ Готово. Применено: ${ran}, baseline: ${baselined}, пропущено: ${skipped}.`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
