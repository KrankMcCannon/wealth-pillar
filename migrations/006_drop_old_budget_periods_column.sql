-- Migration: Drop old budget_periods column from users table
-- Description: Remove deprecated JSONB column after successful migration to budget_periods table
-- Date: 2025-12-29
-- ⚠️  IMPORTANT: Only run this AFTER verifying the migration is successful in production
-- ⚠️  Wait at least 2 weeks after deploying the new schema before running this

-- Safety check: Verify budget_periods table exists and has data
DO $$
DECLARE
  period_count INTEGER;
  user_count INTEGER;
BEGIN
  -- Check if budget_periods table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budget_periods') THEN
    RAISE EXCEPTION 'budget_periods table does not exist. Cannot proceed with dropping old column.';
  END IF;

  -- Check if budget_periods table has data
  SELECT COUNT(*) INTO period_count FROM budget_periods;
  SELECT COUNT(*) INTO user_count FROM users WHERE budget_periods IS NOT NULL AND jsonb_array_length(budget_periods) > 0;

  IF period_count = 0 AND user_count > 0 THEN
    RAISE EXCEPTION 'budget_periods table is empty but users still have budget_periods data. Migration may have failed.';
  END IF;

  RAISE NOTICE 'Safety check passed:';
  RAISE NOTICE '  - budget_periods table exists';
  RAISE NOTICE '  - % periods found in budget_periods table', period_count;
  RAISE NOTICE '  - % users with JSONB budget_periods', user_count;
END $$;

-- Backup strategy: Create a backup table with the old data (optional)
CREATE TABLE IF NOT EXISTS users_budget_periods_backup AS
SELECT id, name, email, budget_periods, created_at
FROM users
WHERE budget_periods IS NOT NULL AND jsonb_array_length(budget_periods) > 0;

-- Log backup results
DO $$
DECLARE
  backup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO backup_count FROM users_budget_periods_backup;
  RAISE NOTICE 'Backup created: % users with budget_periods data saved to users_budget_periods_backup', backup_count;
END $$;

-- Drop the old column
ALTER TABLE users DROP COLUMN IF EXISTS budget_periods;

-- Verify column was dropped
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'budget_periods'
  ) THEN
    RAISE EXCEPTION 'Failed to drop budget_periods column';
  ELSE
    RAISE NOTICE '✅ Successfully dropped users.budget_periods column';
    RAISE NOTICE '✅ Migration complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Rollback instructions (if needed):';
    RAISE NOTICE '  1. ALTER TABLE users ADD COLUMN budget_periods JSONB DEFAULT ''[]''::JSONB;';
    RAISE NOTICE '  2. UPDATE users u SET budget_periods = b.budget_periods FROM users_budget_periods_backup b WHERE u.id = b.id;';
    RAISE NOTICE '  3. DROP TABLE users_budget_periods_backup;';
  END IF;
END $$;

-- Optional: Drop backup table after confirming everything works (run manually after verification)
-- DROP TABLE IF EXISTS users_budget_periods_backup;
