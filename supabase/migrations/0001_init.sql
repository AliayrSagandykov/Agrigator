-- ============================================================
-- Agrigator — схема Postgres для Supabase.
-- Имена таблиц/колонок совпадают с прежней моделью (camelCase в кавычках),
-- чтобы supabase-js возвращал те же поля, что ждёт приложение.
-- JSON-поля хранятся как text (суффикс *Json) и парсятся в коде.
-- Доступ — только сервер (service-role key), поэтому RLS включён без политик
-- (deny-by-default для anon/authenticated; service-role обходит RLS).
-- ============================================================

-- автоустановка "updatedAt"
create or replace function set_updated_at() returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

-- ── User ──────────────────────────────────────────────────
create table "User" (
  id            text primary key default gen_random_uuid()::text,
  role          text not null default 'student' check (role in ('student','tutor','admin')),
  name          text not null,
  email         text not null unique,
  phone         text unique,
  "parentPhone" text,
  "passwordHash" text not null,
  plan          text not null default 'free' check (plan in ('free','pro')),
  "planUntil"   timestamptz,
  "avatarColor" text,
  photo         text,
  "createdAt"   timestamptz not null default now()
);

-- ── Session ───────────────────────────────────────────────
create table "Session" (
  token       text primary key,
  "userId"    text not null references "User"(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "expiresAt" timestamptz not null
);
create index on "Session" ("userId");

-- ── Favorite ──────────────────────────────────────────────
create table "Favorite" (
  id       text primary key default gen_random_uuid()::text,
  "userId" text not null references "User"(id) on delete cascade,
  key      text not null,
  unique ("userId", key)
);

-- ── TutorProfile ──────────────────────────────────────────
create table "TutorProfile" (
  id            text primary key default gen_random_uuid()::text,
  "userId"      text not null unique references "User"(id) on delete cascade,
  "subjectsJson" text not null default '[]',
  "examsJson"    text not null default '[]',
  price          int not null,
  "priceUnit"    text not null default 'час',
  format         text not null default 'online',
  city           text not null default 'Онлайн',
  experience     int not null default 0,
  bio            text not null default '',
  methodology    text not null default '',
  photo          text,
  gradient       text not null default 'g1',
  "responseTime" text not null default '~1 час',
  "videoUrl"     text not null default '',
  "bookingUrl"   text not null default '',
  "calendarId"   text,
  verified       boolean not null default false,
  "aiVerified"   boolean not null default false,
  sponsored      boolean not null default false,
  "ownScoresJson" text not null default '[]',
  "achievementsJson" text not null default '[]',
  "languagesJson"    text not null default '[]',
  "contactsJson"     text not null default '{}',
  "statMetric"    text not null default '',
  "statBefore"    double precision not null default 0,
  "statAfter"     double precision not null default 0,
  "statSample"    int not null default 0,
  "statPassRate"  int not null default 0,
  "statLessons"   int not null default 0,
  "statRetention" int not null default 0,
  trial           boolean not null default true,
  "trialFree"     boolean not null default true,
  source          text not null default 'manual',
  rating          double precision not null default 0,
  "createdAt"     timestamptz not null default now(),
  "updatedAt"     timestamptz not null default now()
);
create trigger trg_tutorprofile_updated before update on "TutorProfile"
  for each row execute function set_updated_at();

-- ── Course ────────────────────────────────────────────────
create table "Course" (
  id            text primary key default gen_random_uuid()::text,
  title         text not null,
  provider      text not null,
  "examsJson"   text not null default '[]',
  price         int not null,
  "priceUnit"   text not null default 'мес',
  format        text not null default 'online',
  city          text not null default 'Онлайн',
  duration      text not null default '',
  "groupSize"   text not null default '',
  level         text not null default '',
  rating        double precision not null default 0,
  students      int not null default 0,
  sponsored     boolean not null default false,
  "aiVerified"  boolean not null default false,
  emoji         text not null default '🎓',
  gradient      text not null default 'g1',
  description   text not null default '',
  "featuresJson" text not null default '[]',
  schedule      text not null default '',
  "scoreStatsJson" text not null default '{}',
  trial         boolean not null default true,
  "trialFree"   boolean not null default true,
  "videoUrl"    text not null default '',
  "bookingUrl"  text not null default '',
  "contactsJson" text not null default '{}',
  "moneyBack"   boolean not null default false,
  source        text not null default 'manual',
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);
create trigger trg_course_updated before update on "Course"
  for each row execute function set_updated_at();

-- ── StudentGoal ───────────────────────────────────────────
create table "StudentGoal" (
  id              text primary key default gen_random_uuid()::text,
  "userId"        text not null unique references "User"(id) on delete cascade,
  exam            text not null,
  deadline        text not null default 'flex',
  pace            text not null default 'slow',
  style           text not null default 'soft',
  "baselineScore" text,
  "baselineSource" text,
  "createdAt"     timestamptz not null default now(),
  "updatedAt"     timestamptz not null default now()
);
create trigger trg_studentgoal_updated before update on "StudentGoal"
  for each row execute function set_updated_at();

-- ── Booking ───────────────────────────────────────────────
create table "Booking" (
  id          text primary key default gen_random_uuid()::text,
  "studentId" text not null references "User"(id) on delete cascade,
  "tutorId"   text not null references "User"(id) on delete cascade,
  "slotAt"    timestamptz not null,
  kind        text not null default 'trial',
  status      text not null default 'created' check (status in ('created','paid','completed','settled','cancelled')),
  "meetLink"  text not null default '',
  note        text not null default '',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
create index on "Booking" ("studentId");
create index on "Booking" ("tutorId");
create trigger trg_booking_updated before update on "Booking"
  for each row execute function set_updated_at();

-- ── Payment ───────────────────────────────────────────────
create table "Payment" (
  id           text primary key default gen_random_uuid()::text,
  "bookingId"  text not null unique references "Booking"(id) on delete cascade,
  amount       int not null,
  status       text not null default 'pending' check (status in ('pending','confirmed','released','refunded')),
  provider     text not null default 'kaspi_manual',
  "externalRef" text,
  "payUrl"     text not null default '',
  "createdAt"  timestamptz not null default now(),
  "updatedAt"  timestamptz not null default now(),
  "confirmedAt" timestamptz,
  "releasedAt"  timestamptz
);
create trigger trg_payment_updated before update on "Payment"
  for each row execute function set_updated_at();

-- ── Lesson ────────────────────────────────────────────────
create table "Lesson" (
  id          text primary key default gen_random_uuid()::text,
  "bookingId" text not null unique references "Booking"(id) on delete cascade,
  "studentId" text not null references "User"(id) on delete cascade,
  "tutorId"   text not null references "User"(id) on delete cascade,
  "happenedAt" timestamptz not null,
  "sequenceNo" int not null default 1,
  "createdAt" timestamptz not null default now()
);
create index on "Lesson" ("tutorId");
create index on "Lesson" ("studentId");

-- ── Result ────────────────────────────────────────────────
create table "Result" (
  id          text primary key default gen_random_uuid()::text,
  "studentId" text not null references "User"(id) on delete cascade,
  "tutorId"   text not null references "User"(id) on delete cascade,
  exam        text not null,
  baseline    double precision,
  "finalScore" double precision,
  delta       double precision,
  status      text not null default 'submitted' check (status in ('submitted','verified','delta_set','rejected')),
  "reportUrl" text not null default '',
  "createdAt" timestamptz not null default now(),
  "verifiedAt" timestamptz
);
create index on "Result" ("tutorId");
create index on "Result" ("studentId");

-- ── Review ────────────────────────────────────────────────
create table "Review" (
  id          text primary key default gen_random_uuid()::text,
  "bookingId" text references "Booking"(id) on delete set null,
  "authorId"  text references "User"(id) on delete set null,
  "authorName" text not null,
  "byRole"    text not null default 'student',
  "targetType" text not null,
  "targetId"  text not null,
  rating      int not null,
  note        text not null default '',
  "beforeScore" text not null default '',
  "afterScore" text not null default '',
  verified    boolean not null default false,
  "createdAt" timestamptz not null default now()
);
create index on "Review" ("targetType", "targetId");

-- ── RetentionSignal ───────────────────────────────────────
create table "RetentionSignal" (
  id          text primary key default gen_random_uuid()::text,
  "studentId" text not null references "User"(id) on delete cascade,
  "tutorId"   text not null,
  reason      text not null,
  "createdAt" timestamptz not null default now()
);

-- ── Lead ──────────────────────────────────────────────────
create table "Lead" (
  id          text primary key default gen_random_uuid()::text,
  source      text not null default 'Вручную',
  url         text not null default '',
  status      text not null default 'new',
  "rawText"   text not null default '',
  "parsedJson" text not null default '{}',
  "foundAt"   timestamptz not null default now()
);

-- ── RLS: deny-by-default (доступ только через service-role на сервере) ──
alter table "User"            enable row level security;
alter table "Session"         enable row level security;
alter table "Favorite"        enable row level security;
alter table "TutorProfile"    enable row level security;
alter table "Course"          enable row level security;
alter table "StudentGoal"     enable row level security;
alter table "Booking"         enable row level security;
alter table "Payment"         enable row level security;
alter table "Lesson"          enable row level security;
alter table "Result"          enable row level security;
alter table "Review"          enable row level security;
alter table "RetentionSignal" enable row level security;
alter table "Lead"            enable row level security;
