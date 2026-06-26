-- ============================================================
-- 0005: интейк студента для двустороннего матча. Аддитивно/идемпотентно.
--   targetScore — целевой балл (baselineScore = стартовый, уже есть)
--   cadence     — желаемая частота: "1" | "2" | "3" | "4+"
--   approachJson — предпочитаемые подходы (пересекаются с APPROACH_OPTIONS)
-- deadline (сроки) и baselineScore (старт) переиспользуются как есть.
-- ============================================================

alter table "StudentGoal"
  add column if not exists "targetScore" text;

alter table "StudentGoal"
  add column if not exists cadence text;

alter table "StudentGoal"
  add column if not exists "approachJson" text not null default '[]';
