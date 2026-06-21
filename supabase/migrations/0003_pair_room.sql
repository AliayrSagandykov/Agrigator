-- ============================================================
-- UX v3: Кабинет пары + таймзоны + дельта с учётом бросивших.
-- Аддитивно и идемпотентно (безопасно в SQL Editor на проде).
-- ============================================================

-- ── User: таймзона, языки, верификация (§5, §10) ──
alter table "User" add column if not exists "timezone" text;
alter table "User" add column if not exists "languagesJson" text not null default '[]';
alter table "User" add column if not exists "verifiedScore" text;
alter table "User" add column if not exists "identityVerified" boolean not null default false;

-- ── StudentGoal: язык обучения (§4) ──
alter table "StudentGoal" add column if not exists "language" text not null default 'ru';

-- ── Lesson: тема урока (один тап), вход, длительность (§2.2, §10) ──
alter table "Lesson" add column if not exists "topic" text not null default '';
alter table "Lesson" add column if not exists "joinedAt" timestamptz;
alter table "Lesson" add column if not exists "durationMin" integer;

-- ── Result: бросившие — для continuation rate / risk-adjust (§9, §10) ──
alter table "Result" add column if not exists "dropped" boolean not null default false;

-- ── Pair: Кабинет пары (центр продукта, §2) ──
create table if not exists "Pair" (
  id          text primary key default gen_random_uuid()::text,
  "studentId" text not null references "User"(id) on delete cascade,
  "tutorId"   text not null references "User"(id) on delete cascade,
  subject     text not null default '',
  status      text not null default 'active' check (status in ('active','paused','ended')),
  "createdAt" timestamptz not null default now(),
  unique ("studentId", "tutorId")
);
create index if not exists "Pair_studentId_idx" on "Pair" ("studentId");
create index if not exists "Pair_tutorId_idx" on "Pair" ("tutorId");

-- ── RoomItem: материалы и домашки (§2.3–2.4, §10) ──
create table if not exists "RoomItem" (
  id          text primary key default gen_random_uuid()::text,
  "pairId"    text not null references "Pair"(id) on delete cascade,
  type        text not null check (type in ('material','homework')),
  title       text not null default '',
  body        text not null default '',
  "fileUrl"   text not null default '',
  "dueAt"     timestamptz,
  status      text not null default 'open',
  "createdById" text references "User"(id) on delete set null,
  "createdAt" timestamptz not null default now()
);
create index if not exists "RoomItem_pairId_idx" on "RoomItem" ("pairId");

-- ── Submission: сдача домашки (§2.4, §10) ──
create table if not exists "Submission" (
  id            text primary key default gen_random_uuid()::text,
  "homeworkId"  text not null references "RoomItem"(id) on delete cascade,
  "studentId"   text not null references "User"(id) on delete cascade,
  "fileUrl"     text not null default '',
  body          text not null default '',
  "submittedAt" timestamptz not null default now(),
  "reviewState" text not null default 'submitted' check ("reviewState" in ('submitted','reviewed')),
  "reviewNote"  text not null default ''
);
create index if not exists "Submission_homeworkId_idx" on "Submission" ("homeworkId");

-- ── ProgressPt: точки прогресса по баллам (§2.5, §10) ──
create table if not exists "ProgressPt" (
  id        text primary key default gen_random_uuid()::text,
  "pairId"  text not null references "Pair"(id) on delete cascade,
  source    text not null default 'mock' check (source in ('diagnostic','mock','official')),
  score     double precision not null,
  label     text not null default '',
  "takenAt" timestamptz not null default now()
);
create index if not exists "ProgressPt_pairId_idx" on "ProgressPt" ("pairId");

-- ── Message: лёгкий контекстный чат пары (§2.6) ──
create table if not exists "Message" (
  id          text primary key default gen_random_uuid()::text,
  "pairId"    text not null references "Pair"(id) on delete cascade,
  "authorId"  text references "User"(id) on delete set null,
  body        text not null,
  "createdAt" timestamptz not null default now()
);
create index if not exists "Message_pairId_idx" on "Message" ("pairId");

-- ── Consent: согласие (родитель для <18), §13 ──
create table if not exists "Consent" (
  id          text primary key default gen_random_uuid()::text,
  "userId"    text not null references "User"(id) on delete cascade,
  type        text not null,
  "grantedBy" text,
  "grantedAt" timestamptz not null default now()
);

alter table "Pair"       enable row level security;
alter table "RoomItem"   enable row level security;
alter table "Submission" enable row level security;
alter table "ProgressPt" enable row level security;
alter table "Message"    enable row level security;
alter table "Consent"    enable row level security;
