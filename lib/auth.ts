import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { query, one } from "@/lib/db";
import type { User, Session } from "@/lib/types";

// ============================================================
// Сессии: cookie-based, на node:crypto. Слой изолирован — позже
// меняется на Supabase Auth (телефон-OTP) без правки вызывающего кода.
// ============================================================

export const SESSION_COOKIE = "agr_session";
const SESSION_TTL_DAYS = 30;

export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(pw, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length &&
    crypto.timingSafeEqual(candidate, expected)
  );
}

export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(u: User): PublicUser {
  const { passwordHash: _omit, ...rest } = u;
  return rest;
}

/** Создаёт сессию и пишет httpOnly-cookie. Вызывать в Route Handler / Server Action. */
export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 864e5);
  await query(
    `insert into "Session" (token, "userId", "expiresAt") values ($1, $2, $3)`,
    [token, userId, expiresAt],
  );
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) await query(`delete from "Session" where token = $1`, [token]);
  cookies().delete(SESSION_COOKIE);
}

/** Текущий пользователь по cookie (или null). Безопасно вызывать в Server Components. */
export async function getCurrentUser(): Promise<User | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await one<Session>(`select * from "Session" where token = $1`, [token]);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    await query(`delete from "Session" where token = $1`, [token]);
    return null;
  }
  return one<User>(`select * from "User" where id = $1`, [session.userId]);
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Войдите в аккаунт", 401);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}
