ALTER TABLE "budget_periods" ADD COLUMN IF NOT EXISTS "budgets_snapshot" jsonb;
-- No backfill: existing closed rows stay null. Do not copy live `budgets`.
-- Restore `budgets_snapshot` from backup/PITR if historical envelopes are needed.
