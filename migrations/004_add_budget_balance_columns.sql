-- Migration: Add cached balance columns to budgets table
-- Description: Store computed budget balances for performance optimization
-- Date: 2025-12-29

-- Add balance caching columns to budgets table
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS current_balance NUMERIC(12, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS balance_updated_at TIMESTAMPTZ DEFAULT NULL;

-- Index for quick balance lookups
CREATE INDEX IF NOT EXISTS idx_budgets_user_balance
  ON budgets(user_id)
  WHERE current_balance IS NOT NULL;

-- Add comments
COMMENT ON COLUMN budgets.current_balance IS 'Cached budget balance (remaining = budget.amount - spent). NULL = not yet calculated. Invalidated when transactions change.';
COMMENT ON COLUMN budgets.balance_updated_at IS 'Timestamp when balance was last calculated. Used to determine if cache is fresh (<5 min = fresh).';

-- Log migration results
DO $$
BEGIN
  RAISE NOTICE 'Budget balance columns added successfully';
  RAISE NOTICE 'All existing budgets will have NULL balance (will be calculated on first access)';
END $$;
