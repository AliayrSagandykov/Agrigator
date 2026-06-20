-- ============================================================
-- Расписание тютора + подтверждение брони (UX §3.2–3.3).
-- Аддитивная миграция (безопасно прогонять на проде в SQL Editor).
-- ============================================================

-- Доступность тютора: массив слотов "<деньНедели>-<час>", где день = JS getDay() (0=Вс..6=Сб).
alter table "TutorProfile" add column if not exists "availabilityJson" text not null default '[]';

-- Подтверждение брони тютором (null = ждёт подтверждения).
alter table "Booking" add column if not exists "acceptedAt" timestamptz;
