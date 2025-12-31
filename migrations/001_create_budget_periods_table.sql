-- Migration: Create budget_periods table
-- Description: Move budget periods from users.budget_periods JSONB to proper relational table
-- Date: 2025-12-29

CREATE TABLE IF NOT EXISTS budget_periods (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Period Dates
  start_date DATE NOT NULL,
  end_date DATE DEFAULT NULL, -- NULL = active/open period

  -- Period Status
  is_active BOOLEAN NOT NULL DEFAULT false,

  -- Aggregated Spending (computed from transactions, auto-updated by trigger)
  total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_saved NUMERIC(12, 2) NOT NULL DEFAULT 0,
  category_spending JSONB NOT NULL DEFAULT '{}', -- {"food": 150.00, "transport": 80.50}

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT budget_periods_dates_check CHECK (end_date IS NULL OR end_date >= start_date),
  -- Partial unique index: only one active period per user
  CONSTRAINT budget_periods_one_active_per_user UNIQUE (user_id, is_active)
    WHERE (is_active = true)
);

-- Indexes for performance optimization
CREATE INDEX idx_budget_periods_user_id ON budget_periods(user_id);
CREATE INDEX idx_budget_periods_is_active ON budget_periods(user_id, is_active)
  WHERE is_active = true;
CREATE INDEX idx_budget_periods_dates ON budget_periods(start_date, end_date);

-- Add comment
COMMENT ON TABLE budget_periods IS 'User budget periods with aggregated spending data. Replaces users.budget_periods JSONB column.';
COMMENT ON COLUMN budget_periods.is_active IS 'Only one active period allowed per user (enforced by partial unique constraint)';
COMMENT ON COLUMN budget_periods.category_spending IS 'JSONB object with category-wise spending breakdown';
