-- Extend budget_periods for relational source of truth + liquidity snapshots
ALTER TABLE budget_periods
  ADD COLUMN IF NOT EXISTS group_id uuid,
  ADD COLUMN IF NOT EXISTS spendable_spent numeric,
  ADD COLUMN IF NOT EXISTS reserve_saved numeric,
  ADD COLUMN IF NOT EXISTS category_spending jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS snapshot_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_budget_periods_user_start
  ON budget_periods (user_id, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_budget_periods_group_id
  ON budget_periods (group_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_periods_one_active_per_user
  ON budget_periods (user_id)
  WHERE is_active = true;
