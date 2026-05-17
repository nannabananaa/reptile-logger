-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query).
--
-- Speeds up the home page by giving each reptile a tiny inline thumbnail
-- and a denormalized "last log at" timestamp, so the home grid no longer
-- has to embed every log just to display the most recent date.
--
-- photo_thumbnail holds a small (~240px) compressed jpeg as a data URL,
-- generated client-side when a photo is uploaded.
--
-- last_log_at is kept fresh by the app on every createLog call.
--
-- All ADDs are IF NOT EXISTS so the script is safe to run repeatedly.

ALTER TABLE reptiles ADD COLUMN IF NOT EXISTS photo_thumbnail text;
ALTER TABLE reptiles ADD COLUMN IF NOT EXISTS last_log_at     timestamptz;

-- One-time backfill: populate last_log_at for reptiles that already have logs.
-- After this, the app keeps it current on every new log.
UPDATE reptiles r
SET    last_log_at = sub.max_at
FROM   (SELECT reptile_id, MAX(created_at) AS max_at FROM logs GROUP BY reptile_id) sub
WHERE  r.id = sub.reptile_id
  AND  r.last_log_at IS NULL;

-- Note: photo_thumbnail for existing reptiles will populate the next time
-- you open each reptile's detail page (the app generates and saves the
-- thumbnail in the background). Or re-upload the photo from the edit screen.
