-- Drop legacy JSON column; recreate stats view from relational budget_periods
DROP VIEW IF EXISTS users_with_stats;

ALTER TABLE users DROP COLUMN IF EXISTS budget_periods;

CREATE VIEW users_with_stats AS
SELECT
  u.id,
  u.clerk_id,
  u.name,
  u.email,
  u.avatar,
  u.theme_color,
  u.budget_start_date,
  u.group_id,
  u.role,
  u.created_at,
  u.updated_at,
  (SELECT count(*)::integer FROM budget_periods bp WHERE bp.user_id = u.id) AS total_budget_periods,
  (SELECT count(*)::integer FROM budget_periods bp WHERE bp.user_id = u.id AND bp.is_active = true) AS active_budget_periods
FROM users u;
