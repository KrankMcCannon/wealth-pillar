-- Migration: Migrate budget_periods data from users.budget_periods JSONB to budget_periods table
-- Description: One-time data migration from JSONB array to relational table
-- Date: 2025-12-29
-- IMPORTANT: Run this AFTER 001_create_budget_periods_table.sql

-- Migrate all budget periods from users.budget_periods JSONB array to budget_periods table
INSERT INTO budget_periods (
  id,
  user_id,
  start_date,
  end_date,
  total_spent,
  total_saved,
  category_spending,
  is_active,
  created_at,
  updated_at
)
SELECT
  (period->>'id')::UUID AS id,
  u.id AS user_id,
  (period->>'start_date')::DATE AS start_date,
  -- Handle NULL and empty string for end_date
  CASE
    WHEN period->>'end_date' IS NULL THEN NULL
    WHEN period->>'end_date' = '' THEN NULL
    ELSE (period->>'end_date')::DATE
  END AS end_date,
  COALESCE((period->>'total_spent')::NUMERIC, 0) AS total_spent,
  COALESCE((period->>'total_saved')::NUMERIC, 0) AS total_saved,
  COALESCE(period->'category_spending', '{}'::JSONB) AS category_spending,
  COALESCE((period->>'is_active')::BOOLEAN, false) AS is_active,
  COALESCE(
    (period->>'created_at')::TIMESTAMPTZ,
    NOW()
  ) AS created_at,
  COALESCE(
    (period->>'updated_at')::TIMESTAMPTZ,
    NOW()
  ) AS updated_at
FROM users u,
LATERAL jsonb_array_elements(u.budget_periods) AS period
WHERE u.budget_periods IS NOT NULL
  AND jsonb_array_length(u.budget_periods) > 0
ON CONFLICT (id) DO NOTHING; -- Skip if already migrated

-- Log migration results
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM budget_periods;
  RAISE NOTICE 'Migration completed: % budget periods migrated', migrated_count;
END $$;
