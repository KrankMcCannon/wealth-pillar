# Legacy hand-written migrations

These SQL files were applied to production before Drizzle Kit journal adoption (`0000_baseline_existing_db`).

Do not re-run on existing databases. Kept for historical reference only.

Supabase migration history (authoritative for already-applied DDL):

- `extend_budget_periods_liquidity_amounts`
- `backfill_budget_periods_from_json`
- `drop_users_budget_periods_recreate_view`
