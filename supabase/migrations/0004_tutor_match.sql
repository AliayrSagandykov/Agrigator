-- ============================================================
-- 0004: матчмейкинг тютора. Аддитивно и идемпотентно — безопасно
-- прогонять на боевой базе с данными.
--   teachBandsJson — диапазоны баллов «кому могу помогать» по экзаменам:
--     { "IELTS": {"from":7,"to":8}, "SAT": {"from":1300,"to":1450} }
--   matchPrefsJson — каденс / горизонт / уровни / подход:
--     { "cadence":["2","3"], "horizon":["standard"], "levels":["advanced"], "approach":["exam_hacks"] }
-- subjectsJson переиспользуется под выбранные специализации (как и раньше).
-- ============================================================

alter table "TutorProfile"
  add column if not exists "teachBandsJson" text not null default '{}';

alter table "TutorProfile"
  add column if not exists "matchPrefsJson" text not null default '{}';
