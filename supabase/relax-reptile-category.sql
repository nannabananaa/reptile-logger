-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query).
--
-- Drops any leftover CHECK constraint on reptiles.category. The category set
-- changed from 9 plural values (snakes, geckos, tortoises, turtles,
-- bearded_dragons, chameleons, iguanas, skinks, other) to 3 singular ones
-- (tortoise, gecko, snake). An old CHECK that still permits only the plural
-- values will silently reject inserts with the new singular ones, which is
-- the root cause of "can't save my third reptile."
--
-- Also makes the column nullable so a reptile can be saved without picking
-- a type. (The app will continue to default to a valid value on the client.)

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
