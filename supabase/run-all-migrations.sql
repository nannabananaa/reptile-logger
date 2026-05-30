-- =====================================================================
-- REPTILE LOGGER — full schema migration
-- Paste this entire file into the Supabase SQL Editor and click "Run".
-- Safe to run repeatedly: every change uses IF NOT EXISTS / IF EXISTS,
-- and the constraint cleanup is idempotent.
--
-- After running this, the app has every column / constraint it expects
-- and will stop printing "missing column" warnings in the console.
-- =====================================================================


-- ─────────────────────────────────────────────────────────────────────
-- reptiles: home-page fast columns
-- ─────────────────────────────────────────────────────────────────────
-- photo_thumbnail: tiny (~240px) compressed JPEG data URL. Loaded by the
--   home grid instead of the full photo so the page stays small even with
--   many reptiles.
-- last_log_at:   denormalized "most recent log timestamp" so the home grid
--   doesn't need to embed the logs table to render "5h ago".

ALTER TABLE reptiles ADD COLUMN IF NOT EXISTS photo_thumbnail text;
ALTER TABLE reptiles ADD COLUMN IF NOT EXISTS last_log_at     timestamptz;


-- ─────────────────────────────────────────────────────────────────────
-- reptiles: dual-side toggle
-- ─────────────────────────────────────────────────────────────────────
-- When true, the log form asks for warm-side and cool-side temperature
-- and humidity separately. The actual warm/cool readings live inside
-- logs.category_fields so no extra columns are needed on the logs table.

ALTER TABLE reptiles ADD COLUMN IF NOT EXISTS dual_sides boolean DEFAULT false;


-- ─────────────────────────────────────────────────────────────────────
-- reptiles.category: allow nulls + drop legacy CHECK constraints
-- ─────────────────────────────────────────────────────────────────────
-- Older schemas had a CHECK that only allowed the old plural category
-- values (snakes, geckos, ...). The current category set is singular
-- (tortoise, gecko, snake) so any leftover CHECK would silently reject
-- inserts. This drops any such constraint and makes the column nullable
-- so a reptile can be saved without picking a type.

ALTER TABLE reptiles ALTER COLUMN category DROP NOT NULL;

DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.reptiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%category%'
  LOOP
    EXECUTE format('ALTER TABLE public.reptiles DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;


-- ─────────────────────────────────────────────────────────────────────
-- logs.category_fields: jsonb bucket for per-category extras
-- ─────────────────────────────────────────────────────────────────────
-- All of the following are stored INSIDE this jsonb column rather than as
-- dedicated columns — so the schema never needs a migration when we add a
-- new per-category field:
--
--   * vet_notes              (string)
--   * enclosure_cleaned_date (string, YYYY-MM-DD)
--   * warm_temp, cool_temp, warm_humidity, cool_humidity (numbers)
--   * food_type, shed_date, shed_quality, feeding_response, length_inches
--   * photo (compressed JPEG data URL for the log photo)

ALTER TABLE logs ADD COLUMN IF NOT EXISTS category_fields jsonb DEFAULT '{}';


-- ─────────────────────────────────────────────────────────────────────
-- One-time backfill: populate reptiles.last_log_at from existing logs.
-- After this, the app keeps it fresh on every createLog call.
-- ─────────────────────────────────────────────────────────────────────

UPDATE reptiles r
SET    last_log_at = sub.max_at
FROM   (SELECT reptile_id, MAX(created_at) AS max_at
        FROM   logs
        GROUP  BY reptile_id) sub
WHERE  r.id = sub.reptile_id
  AND  r.last_log_at IS NULL;


-- ─────────────────────────────────────────────────────────────────────
-- Notes on photos
-- ─────────────────────────────────────────────────────────────────────
-- photo_thumbnail for older reptiles populates lazily:
--   * The home page now backfills missing thumbnails in the background.
--     The first time you load the home page after running this migration,
--     it will fetch each legacy photo once, compress it client-side, and
--     save the thumbnail. Subsequent visits load only the cheap column.
--   * You can also force-regenerate by re-uploading the photo from the
--     reptile edit screen.
