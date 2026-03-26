-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This sets up Row Level Security so each user can only access their own data,
-- plus data for reptiles that are shared with them.

-- ============================================================
-- REPTILES TABLE
-- ============================================================

-- Enable RLS (safe to run even if already enabled)
ALTER TABLE reptiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own reptiles" ON reptiles;
DROP POLICY IF EXISTS "Users can view shared reptiles" ON reptiles;
DROP POLICY IF EXISTS "Users can insert their own reptiles" ON reptiles;
DROP POLICY IF EXISTS "Users can update their own reptiles" ON reptiles;
DROP POLICY IF EXISTS "Users can delete their own reptiles" ON reptiles;

-- Create policies
CREATE POLICY "Users can view their own reptiles"
  ON reptiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared reptiles"
  ON reptiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_reptiles
      WHERE shared_reptiles.reptile_id = reptiles.id
        AND shared_reptiles.shared_with_id = auth.uid()
        AND shared_reptiles.status = 'accepted'
    )
  );

CREATE POLICY "Users can insert their own reptiles"
  ON reptiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reptiles"
  ON reptiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reptiles"
  ON reptiles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- LOGS TABLE
-- ============================================================

ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own logs" ON logs;
DROP POLICY IF EXISTS "Users can view logs on shared reptiles" ON logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON logs;
DROP POLICY IF EXISTS "Users can insert logs on shared reptiles" ON logs;
DROP POLICY IF EXISTS "Users can update their own logs" ON logs;
DROP POLICY IF EXISTS "Users can delete their own logs" ON logs;

-- Owner can see all logs on their reptiles (regardless of who created them)
CREATE POLICY "Users can view their own logs"
  ON logs FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM reptiles
      WHERE reptiles.id = logs.reptile_id
        AND reptiles.user_id = auth.uid()
    )
  );

-- Shared users can see all logs on reptiles shared with them
CREATE POLICY "Users can view logs on shared reptiles"
  ON logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shared_reptiles
      WHERE shared_reptiles.reptile_id = logs.reptile_id
        AND shared_reptiles.shared_with_id = auth.uid()
        AND shared_reptiles.status = 'accepted'
    )
  );

-- Users can insert logs with their own user_id
CREATE POLICY "Users can insert their own logs"
  ON logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Shared users can insert logs on reptiles shared with them
CREATE POLICY "Users can insert logs on shared reptiles"
  ON logs FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM shared_reptiles
      WHERE shared_reptiles.reptile_id = logs.reptile_id
        AND shared_reptiles.shared_with_id = auth.uid()
        AND shared_reptiles.status = 'accepted'
    )
  );

CREATE POLICY "Users can update their own logs"
  ON logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logs"
  ON logs FOR DELETE
  USING (auth.uid() = user_id);
