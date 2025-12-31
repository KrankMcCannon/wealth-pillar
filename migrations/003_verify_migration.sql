-- Migration: Verify budget_periods data migration
-- Description: Check that all JSONB periods were correctly migrated to table
-- Date: 2025-12-29
-- IMPORTANT: Run this AFTER 002_migrate_budget_periods_data.sql

-- Compare counts: JSONB array length vs table rows
WITH jsonb_counts AS (
  SELECT
    id AS user_id,
    name AS user_name,
    jsonb_array_length(COALESCE(budget_periods, '[]'::JSONB)) AS jsonb_count
  FROM users
),
table_counts AS (
  SELECT
    user_id,
    COUNT(*) AS table_count
  FROM budget_periods
  GROUP BY user_id
)
SELECT
  COALESCE(j.user_id, t.user_id) AS user_id,
  COALESCE(j.user_name, 'Unknown') AS user_name,
  COALESCE(j.jsonb_count, 0) AS periods_in_jsonb,
  COALESCE(t.table_count, 0) AS periods_in_table,
  CASE
    WHEN COALESCE(j.jsonb_count, 0) = COALESCE(t.table_count, 0) THEN '✅ OK'
    WHEN COALESCE(j.jsonb_count, 0) > COALESCE(t.table_count, 0) THEN '❌ MISSING in table'
    ELSE '⚠️  EXTRA in table'
  END AS status
FROM jsonb_counts j
FULL OUTER JOIN table_counts t ON j.user_id = t.user_id
ORDER BY status DESC, user_name;

-- Should return rows with status '✅ OK' for all users
-- If any '❌ MISSING' or '⚠️ EXTRA', investigate before proceeding

-- Check for orphaned periods (user_id doesn't exist in users table)
SELECT
  bp.id AS period_id,
  bp.user_id,
  bp.start_date,
  bp.is_active,
  '❌ Orphaned (user not found)' AS issue
FROM budget_periods bp
LEFT JOIN users u ON bp.user_id = u.id
WHERE u.id IS NULL;

-- Should return 0 rows

-- Check for users with multiple active periods (constraint violation)
SELECT
  user_id,
  COUNT(*) AS active_periods_count,
  array_agg(id) AS period_ids,
  '❌ Multiple active periods' AS issue
FROM budget_periods
WHERE is_active = true
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Should return 0 rows

-- Summary statistics
SELECT
  COUNT(DISTINCT user_id) AS total_users_with_periods,
  COUNT(*) AS total_periods,
  COUNT(*) FILTER (WHERE is_active = true) AS active_periods,
  COUNT(*) FILTER (WHERE end_date IS NULL) AS open_periods,
  COUNT(*) FILTER (WHERE end_date IS NOT NULL) AS closed_periods,
  ROUND(AVG(total_spent)::NUMERIC, 2) AS avg_total_spent,
  ROUND(AVG(total_saved)::NUMERIC, 2) AS avg_total_saved
FROM budget_periods;
