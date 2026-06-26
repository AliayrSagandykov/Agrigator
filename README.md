# 🎓 Agrigator — агрегатор тюторов с верифицированными результатами

Платформа выбора тютора **по реальным результатам, а не по чужому логотипу**. Узкий вход — тест-преп (SAT / IELTS / ЕНТ-НМТ и др.), где результат проверяется извне.

Старая vanilla-JS реализация сохранена в [`legacy/`](./legacy).

---

## Стек

| Слой | Технология |
|---|---|
| Фронт + бэк | **Next.js 14 (App Router) + TypeScript** |
| UI | **Tailwind CSS** + лёгкие shadcn-style примитивы |
| БД | **Supabase (Postgres)** через **node-postgres (`pg`)**, чистый SQL |
| Авторизация | cookie-сессии (изолированы, готовы к замене на Supabase Auth) |
| Платежи | сервисный слой `manual \| auto` (Kaspi) |
| Хостинг | **Vercel** + Supabase managed |

Без ORM: схема — обычный SQL (`supabase/migrations`), доступ — параметризованные запросы (`lib/db.ts`, `lib/queries.ts`). На Vercel (serverless) подключаемся через **Connection Pooler** Supabase (Supavisor, transaction mode).

---

## Локальный запуск

Нужен Node ≥ 20.12 и доступ к Postgres (Supabase-проект **или** локальный Postgres).

```bash
npm install

# .env.local с строкой подключения (см. ниже про Supabase)
echo 'DATABASE_URL="postgres://postgres@localhost:5432/agrigator"' > .env.local
echo 'PAYMENT_MODE="manual"' >> .env.local

npm run db:migrate    # применить схему (supabase/migrations/*.sql)
npm run db:seed       # засеять демо-данными
npm run dev           # http://localhost:3000
```

### Демо-входы

| Роль | Email | Пароль |
|---|---|---|
| 👑 Оператор (admin) | admin@agrigator.kz | admin123 |
| 🎓 Тютор | aigerim@agrigator.kz | tutor123 |
| 👤 Студент | user@demo.kz | demo123 |

---

## Деплой: Supabase + Vercel

### 1. Supabase (база)
1. Создай проект на [supabase.com](https://supabase.com) (фри-тариф).
2. **Применить миграции.** Проще всего — локально с боевой строкой подключения:
   `DATABASE_URL="<строка 5432>" npm run db:migrate`. Команда **безопасна для боевой
   базы**: ничего не дропает, ведёт учёт применённого в таблице `_migration` и
   докатывает только новые файлы (существующая схема «бейзлайнится»). Поэтому при
   обновлении (новые колонки матча и т.п.) достаточно снова прогнать `db:migrate`.
   _Альтернатива:_ вставить новые `supabase/migrations/*.sql` в **SQL Editor** Supabase —
   они идемпотентны (`if not exists`).
3. **Project Settings → Database → Connection string.** Понадобятся две строки:
   - **Transaction pooler** (порт `6543`) → это `DATABASE_URL` для Vercel (serverless).
   - **Session pooler / Direct** (порт `5432`) → для разовых `db:migrate`/`db:seed`
     с ноутбука (лучше держит DDL и батч-вставки, чем transaction-пулер).
   В обеих подставь пароль БД.
4. Засеять демо-данными (по желанию, чтобы каталог был не пустой): локально
   `DATABASE_URL="<строка 5432>" npm run db:seed`.

### 2. Vercel (приложение)
1. Импортируй репозиторий на [vercel.com](https://vercel.com) (Framework = Next.js, определится сам).
2. **Environment Variables:**
   | Ключ | Значение |
   |---|---|
   | `DATABASE_URL` | строка из Connection Pooler Supabase (порт 6543) |
   | `PAYMENT_MODE` | `manual` |
3. **Deploy**. Готово.

> Почему пулер: на serverless каждый инстанс открывает свои коннекты. Пулер Supabase (transaction mode) их мультиплексирует — прямое подключение к 5432 на Vercel быстро упрётся в лимит.

### Переключение на авто-оплату (потом)
Поставь `PAYMENT_MODE=auto`, добавь `KASPI_*` ключи и подними вебхук `app/api/webhooks/kaspi` — остальной код не меняется (см. ниже).

---

## Архитектура переключателей (сердце системы)

Каждая рисковая операция (оплата, эскроу, верификация дельты, выплата) — **сервис за интерфейсом** с одним флагом режима. Ручной и авто-режим меняют только *триггер* (человек или вебхук/крон); состояния в БД и логика — одни и те же. Переход = флаг в env, не рефактор.

```
PAYMENT_MODE=manual   # оператор подтверждает оплату в /admin
PAYMENT_MODE=auto     # тот же confirmPayment дёргает вебхук Kaspi
```

`lib/payments/` — `PaymentProvider` (`KaspiManual` → `KaspiMerchantAPI`). Весь код зовёт `payments.confirmPayment(...)` и не знает, кто за этим.

**State machines (одни на оба режима):**
- `booking`: `created → paid → completed → settled`
- `payment`: `pending → confirmed → released`
- `result`: `submitted → verified → delta_set`

---

## Принцип данных

> Где у тютора есть мотив соврать (был ли урок, baseline, дельта) — цифру ставит **система** или вторая сторона.

- **Дельта** = `finalScore − baseline`, считает система при верификации. Тютор не вводит ни baseline, ни дельту.
- **Удержание** = доля учеников с повторным уроком (`Lesson.sequenceNo ≥ 2`).
- Метрики карточек берут кэш (cold-start); дашборды считают вживую из `Lesson/Result` (`lib/metrics.ts`).

---

## Что реализовано

**Студент:** интейк (4 вопроса) → матч → каталог/профиль → бронь с авто-ссылкой → оплата в эскроу → кабинет (прогресс, загрузка результата, перебронь, ретеншн-микровопрос).
**Тютор:** онбординг профиля, кабинет с тремя метриками (дельта · уроки · удержание), инбокс броней.
**Оператор `/admin`:** подтверждение оплат, верификация результатов (система считает дельту), лиды парсера.
**Авто-путь заложен:** `app/api/webhooks/kaspi` зовёт тот же `confirmPayment`.

### Отложено (v2+)
AI-ассистент уроков · авто-парсинг score report · диагностика-мок · Supabase Auth (телефон-OTP) · Telegram-бот/Inngest/PostHog. Интерфейсы под это на месте.

---

## Структура

```
app/                     страницы и API-роуты (App Router)
lib/
  db.ts                  пул pg + хелперы query/one/withTransaction
  types.ts               типы строк таблиц
  queries.ts             реляционные чтения для страниц
  auth.ts                сессии (→ Supabase Auth)
  payments/              manual|auto провайдер (сердце)
  bookings.ts · meet.ts · metrics.ts · match.ts · tutors.ts · …
components/              ui-примитивы + доменные (delta-chart, tutor-card, …)
supabase/
  migrations/0001_init.sql   SQL-схема (вставить в Supabase SQL Editor)
  config.toml                конфиг локального стека supabase CLI
scripts/
  migrate.ts             применить схему (кроссплатформенно, без psql)
  seed.ts                засеять демо-данными
legacy/                  старая vanilla-JS реализация (для справки)
```

---

## Команды

```bash
npm run dev         # дев-сервер
npm run build       # прод-сборка
npm run db:migrate  # докатить новые миграции (безопасно, без дропа; учёт в _migration)
npm run db:seed     # засеять демо-данными
npm run db:reset    # ПЕРЕсоздать с нуля: дроп таблиц + миграции + сид (только локально!)
```

Все данные на сайте — демонстрационные.
