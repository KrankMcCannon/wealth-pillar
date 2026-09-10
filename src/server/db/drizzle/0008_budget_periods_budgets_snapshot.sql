ALTER TABLE "budget_periods" ADD COLUMN IF NOT EXISTS "budgets_snapshot" jsonb;
