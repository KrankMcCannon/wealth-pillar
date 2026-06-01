-- GATED: review with Supabase performance advisors before applying to production.
-- Apply via Supabase SQL editor or `apply_migration` after sign-off.
-- Re-run advisors after apply; unused-index list evolves with workload.

-- Duplicate index (advisor: duplicate_index on categories)
DROP INDEX IF EXISTS public.idx_categories_key_unique;

-- Unindexed foreign keys (advisor: unindexed_foreign_keys)
CREATE INDEX IF NOT EXISTS idx_group_invitations_invited_by_user_id
  ON public.group_invitations (invited_by_user_id);

CREATE INDEX IF NOT EXISTS idx_users_default_account_id
  ON public.users (default_account_id);

-- Additional unused indexes: export fresh list from Supabase Dashboard → Database → Advisors
-- (performance → Unused Index) and drop in a follow-up migration after query-plan review.
