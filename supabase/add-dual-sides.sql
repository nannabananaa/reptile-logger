-- Run in the Supabase SQL Editor (Dashboard > SQL Editor > New Query).
--
-- Adds the dual_sides toggle to the reptiles table. This is the ONLY schema
-- change required for warm/cool side tracking — the actual warm/cool readings
-- are stored inside the existing logs.category_fields jsonb column, so no
-- new columns are needed on the logs table.
--
-- Safe to run repeatedly: IF NOT EXISTS is a no-op if the column is already there.

ALTER TABLE reptiles ADD COLUMN IF NOT EXISTS dual_sides boolean DEFAULT false;
