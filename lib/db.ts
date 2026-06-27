import "server-only";
import { Pool, type PoolClient } from "pg";

// ============================================================
// Доступ к Postgres через node-postgres.
// Dev/local: обычный Postgres. Prod: Supabase — берём строку из
// Connection Pooler (Supavisor, transaction mode, порт 6543), она
// рассчитана на serverless (Vercel). SSL включается автоматически
// для не-localhost.
// ============================================================

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL не задан. Локально: postgres://postgres@localhost:5432/agrigator. " +
      "Прод: строка из Supabase → Project Settings → Database → Connection Pooler.",
  );
}

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

const globalForPg = globalThis as unknown as { pgPool?: Pool };

// На serverless (Vercel prod) держим коннектов мало — много инстансов делят
// пул Supabase. Но один долгоживущий процесс (dev / next start) выигрывает от
// большего пула: параллельные запросы страницы не встают в очередь по 160 мс.
const isServerless = process.env.NODE_ENV === "production" && !isLocal;

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: isServerless ? 3 : 10,
    keepAlive: true, // держим TCP-соединение тёплым — меньше дорогих реконнектов
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pool.query(text, params as never[]);
  return res.rows as T[];
}

export async function one<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
