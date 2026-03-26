-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- This sets up Row Level Security so each user can only access their own data.

-- ============================================================
-- REPTILES TABLE
-- ============================================================

-- Enable RLS (safe to run even if already enabled)
ALTER TABLE reptiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own reptiles" ON reptiles;
DROP POLICY IF EXISTS "Users can insert their own reptiles" ON reptiles;
DROP POLICY IF EXISTS "Users can update their own reptiles" ON reptiles;
DROP POLICY IF EXISTS "Users can delete their own reptiles" ON reptiles;

-- Create policies
CREATE POLICY "Users can view their own reptiles"
  ON reptiles FOR SELECT
  USING (auth.uid() = user_id);

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
DROP POLICY IF EXISTS "Users can insert their own logs" ON logs;
DROP POLICY IF EXISTS "Users can update their own logs" ON logs;
DROP POLICY IF EXISTS "Users can delete their own logs" ON logs;

CREATE POLICY "Users can view their own logs"
  ON logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
  ON logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs"
  ON logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logs"
  ON logs FOR DELETE
  USING (auth.uid() = user_id);
