import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { verifyPassword, createSession, toPublicUser, hashPassword } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import type { User } from "@/lib/types";

// Фиктивный хэш: сверяем с ним, когда юзера нет — чтобы время ответа не выдавало
// существование email (анти-таймин­г-оракул для перечисления пользователей).
const DUMMY_HASH = hashPassword("timing-equalizer-not-a-real-password");

export async function POST(req: Request) {
  // Брутфорс-защита: не больше 10 попыток за 5 минут с одного IP.
  const rl = rateLimit(`login:${clientIp(req)}`, 10, 5 * 60_000);
  if (!rl.ok)
    return NextResponse.json(
      { error: "Слишком много попыток входа. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").toLowerCase().trim();
  const password = String(body.password ?? "");

  const user = await one<User>(`select * from "User" where email = $1`, [email]);
  // Всегда выполняем сверку (с реальным или фиктивным хэшем) — постоянное время.
  const valid = verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  // Единое сообщение и для несуществующего email, и для неверного пароля —
  // не раскрываем, какой именно email зарегистрирован.
  if (!user || !valid)
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });

  await createSession(user.id);
  return NextResponse.json({ user: toPublicUser(user) });
}
