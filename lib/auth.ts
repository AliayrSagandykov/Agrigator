import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { User } from "@prisma/client";

// ============================================================
// Сессии: cookie-based, на node:crypto (без внешних зависимостей).
// Слой изолирован — позже меняется на Supabase Auth (телефон-OTP)
// без переписывания вызывающего кода.
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

/** Создаёт сессию и пишет httpOnly-cookie. Вызывать только в Route Handler / Server Action. */
export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 864e5);
  await prisma.session.create({ data: { token, userId, expiresAt } });
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
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookies().delete(SESSION_COOKIE);
}

/** Текущий пользователь по cookie (или null). Безопасно вызывать в Server Components. */
export async function getCurrentUser(): Promise<User | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.deleteMany({ where: { token } });
    return null;
  }
  return session.user;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Войдите в аккаунт", 401);
  return user;
}

export async function requireRole(role: "student" | "tutor" | "admin"): Promise<User> {
  const user = await requireUser();
  if (user.role !== role && user.role !== "admin") {
    throw new AuthError("Недостаточно прав", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}
