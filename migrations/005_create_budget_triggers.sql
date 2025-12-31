-- Migration: Create PostgreSQL triggers for automatic budget updates
-- Description: Auto-update budget_periods aggregates and invalidate budget balance cache when transactions change
-- Date: 2025-12-29

-- ============================================================================
-- Trigger 1: Auto-update budget_periods aggregates when transactions change
-- ============================================================================

CREATE OR REPLACE FUNCTION update_budget_period_aggregates()
RETURNS TRIGGER AS $$
DECLARE
  affected_user_id UUID;
  active_period RECORD;
  new_total_spent NUMERIC;
  new_category_spending JSONB;
BEGIN
  -- Get affected user_id (works for INSERT, UPDATE, DELETE)
  affected_user_id := COALESCE(NEW.user_id, OLD.user_id);

  -- Find active period for user
  SELECT * INTO active_period
  FROM budget_periods
  WHERE user_id = affected_user_id AND is_active = true
  LIMIT 1;

  -- If no active period, nothing to update
  IF active_period IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Recalculate aggregates from all transactions in active period
  SELECT
    -- Total spent: expenses + transfers - income (min 0)
    COALESCE(SUM(
      CASE
        WHEN type IN ('expense', 'transfer') THEN amount
        WHEN type = 'income' THEN -amount
        ELSE 0
      END
    ), 0),
    -- Category spending breakdown
    COALESCE(
      jsonb_object_agg(
        category,
        SUM(
          CASE
            WHEN type IN ('expense', 'transfer') THEN amount
            WHEN type = 'income' THEN -amount
            ELSE 0
          END
        )
      ) FILTER (WHERE category IS NOT NULL),
      '{}'::JSONB
    )
  INTO new_total_spent, new_category_spending
  FROM transactions
  WHERE user_id = affected_user_id
    AND date >= active_period.start_date
    AND (active_period.end_date IS NULL OR date <= active_period.end_date);

  -- Update period with new aggregates
  UPDATE budget_periods
  SET
    total_spent = GREATEST(0, new_total_spent),
    category_spending = new_category_spending,
    updated_at = NOW()
  WHERE id = active_period.id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on transactions table
DROP TRIGGER IF EXISTS trigger_update_budget_period_aggregates ON transactions;
CREATE TRIGGER trigger_update_budget_period_aggregates
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_budget_period_aggregates();

COMMENT ON FUNCTION update_budget_period_aggregates() IS 'Automatically recalculates budget period aggregates (total_spent, category_spending) when transactions change';

-- ============================================================================
-- Trigger 2: Invalidate budget balance cache when transactions change
-- ============================================================================

CREATE OR REPLACE FUNCTION invalidate_budget_balance_cache()
RETURNS TRIGGER AS $$
DECLARE
  affected_user_id UUID;
BEGIN
  -- Get affected user_id
  affected_user_id := COALESCE(NEW.user_id, OLD.user_id);

  -- Invalidate all budget balances for this user
  -- (Next access will recalculate fresh balance)
  UPDATE budgets
  SET
    current_balance = NULL,
    balance_updated_at = NULL
  WHERE user_id = affected_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on transactions table
DROP TRIGGER IF EXISTS trigger_invalidate_budget_balance_cache ON transactions;
CREATE TRIGGER trigger_invalidate_budget_balance_cache
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION invalidate_budget_balance_cache();

COMMENT ON FUNCTION invalidate_budget_balance_cache() IS 'Invalidates cached budget balances when transactions change, forcing recalculation on next access';

-- ============================================================================
-- Trigger 3: Update budget_periods.updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on budget_periods table
DROP TRIGGER IF EXISTS trigger_update_budget_periods_updated_at ON budget_periods;
CREATE TRIGGER trigger_update_budget_periods_updated_at
BEFORE UPDATE ON budget_periods
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp on row modification';

-- Log migration results
DO $$
BEGIN
  RAISE NOTICE 'PostgreSQL triggers created successfully:';
  RAISE NOTICE '  1. update_budget_period_aggregates - Auto-updates period totals';
  RAISE NOTICE '  2. invalidate_budget_balance_cache - Auto-invalidates budget balances';
  RAISE NOTICE '  3. update_budget_periods_updated_at - Auto-updates timestamps';
END $$;
