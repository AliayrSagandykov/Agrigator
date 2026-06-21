// ============================================================
// Применить SQL-схему к Postgres/Supabase (кроссплатформенно, без psql).
// Запуск: npm run db:migrate   (DATABASE_URL из .env.local)
// Дропает только наши таблицы (safe на Supabase) и применяет миграции.
// Альтернатива: вставить supabase/migrations/0001_init.sql в SQL Editor Supabase.
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

const TABLES = [
  "Consent", "Message", "ProgressPt", "Submission", "RoomItem", "Pair",
  "RetentionSignal", "Review", "Result", "Lesson", "Payment", "Booking",
  "StudentGoal", "Favorite", "Session", "TutorProfile", "Course", "Lead", "User",
];

async function main() {
  const client = new Client({ connectionString: url, ssl: isLocal ? false : { rejectUnauthorized: false } });
  await client.connect();

  console.log("🧹 Дроп существующих таблиц…");
  await client.query(`drop table if exists ${TABLES.map((t) => `"${t}"`).join(", ")} cascade`);

  const dir = join(process.cwd(), "supabase", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    console.log("▶︎ применяю", f);
    await client.query(readFileSync(join(dir, f), "utf8"));
  }

  console.log("✅ Схема применена.");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
