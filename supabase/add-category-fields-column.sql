-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Adds the category_fields JSONB column to the logs table.
-- This column stores reptile-type-specific data (food_type, shed_date, etc.)

ALTER TABLE logs ADD COLUMN IF NOT EXISTS category_fields jsonb DEFAULT '{}';
