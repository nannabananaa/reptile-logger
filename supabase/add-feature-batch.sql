-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query).
--
-- Adds the schema needed for the feature batch:
--   * dual_sides toggle per reptile (warm + cool side tracking)
--   * dual-side temperature / humidity columns on logs
--   * universal vet_notes and enclosure_cleaned_date columns on logs
--
-- All ADDs use IF NOT EXISTS so this script is safe to run repeatedly.
-- The log photo and the snake/gecko-specific extras (shed_quality,
-- feeding_response, length_inches) live inside the existing
-- category_fields jsonb column — no schema change required for those.

ALTER TABLE reptiles ADD COLUMN IF NOT EXISTS dual_sides boolean DEFAULT false;

ALTER TABLE logs ADD COLUMN IF NOT EXISTS warm_temp     numeric;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS cool_temp     numeric;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS warm_humidity numeric;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS cool_humidity numeric;

ALTER TABLE logs ADD COLUMN IF NOT EXISTS vet_notes              text;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS enclosure_cleaned_date date;
