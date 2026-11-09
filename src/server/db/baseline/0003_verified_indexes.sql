SET LOCAL ROLE postgres;
DO $$ BEGIN
IF current_setting('wealth_pillar.fresh_install',true)='true' THEN
EXECUTE 'CREATE INDEX IF NOT EXISTS bank_connections_account_idx ON public.bank_connections USING btree (account_id)';
EXECUTE 'CREATE INDEX IF NOT EXISTS bank_connections_group_idx ON public.bank_connections USING btree (group_id)';
EXECUTE 'CREATE INDEX IF NOT EXISTS bank_rules_user_idx ON public.bank_merchant_rules USING btree (user_id)';
EXECUTE 'CREATE INDEX IF NOT EXISTS bank_events_connection_idx ON public.bank_notification_events USING btree (connection_id)';
EXECUTE 'CREATE INDEX IF NOT EXISTS bank_events_group_idx ON public.bank_notification_events USING btree (group_id)';
EXECUTE 'CREATE INDEX IF NOT EXISTS invitations_inviter_idx ON public.group_invitations USING btree (invited_by_user_id)';
EXECUTE 'CREATE INDEX IF NOT EXISTS users_default_account_idx ON public.users USING btree (default_account_id)';
EXECUTE 'CREATE INDEX IF NOT EXISTS bank_events_transaction_idx ON public.bank_notification_events USING btree (transaction_id)';
EXECUTE 'CREATE INDEX IF NOT EXISTS budgets_group_idx ON public.budgets USING btree (group_id)';
EXECUTE 'CREATE INDEX IF NOT EXISTS transactions_group_keyset_idx ON public.transactions USING btree (group_id, date DESC, created_at DESC NULLS LAST, id DESC)';
EXECUTE 'CREATE INDEX IF NOT EXISTS transactions_group_user_keyset_idx ON public.transactions USING btree (group_id, user_id, date DESC, created_at DESC NULLS LAST, id DESC)';
EXECUTE 'CREATE INDEX IF NOT EXISTS transactions_group_transfer_keyset_idx ON public.transactions USING btree (group_id, date DESC, created_at DESC NULLS LAST, id DESC) WHERE type = ''transfer''';
END IF;
IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='bank_connections_account_idx' AND i.indisvalid AND i.indisready) THEN RAISE EXCEPTION 'Prepare concurrent indexes before migrating'; END IF;
IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='bank_connections_group_idx' AND i.indisvalid AND i.indisready) THEN RAISE EXCEPTION 'Prepare concurrent indexes before migrating'; END IF;
IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='bank_rules_user_idx' AND i.indisvalid AND i.indisready) THEN RAISE EXCEPTION 'Prepare concurrent indexes before migrating'; END IF;
IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='bank_events_connection_idx' AND i.indisvalid AND i.indisready) THEN RAISE EXCEPTION 'Prepare concurrent indexes before migrating'; END IF;
IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='bank_events_group_idx' AND i.indisvalid AND i.indisready) THEN RAISE EXCEPTION 'Prepare concurrent indexes before migrating'; END IF;
IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='invitations_inviter_idx' AND i.indisvalid AND i.indisready) THEN RAISE EXCEPTION 'Prepare concurrent indexes before migrating'; END IF;
IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='users_default_account_idx' AND i.indisvalid AND i.indisready) THEN RAISE EXCEPTION 'Prepare concurrent indexes before migrating'; END IF;
IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='bank_events_transaction_idx' AND i.indisvalid AND i.indisready) THEN RAISE EXCEPTION 'Prepare concurrent indexes before migrating'; END IF;
IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='budgets_group_idx' AND i.indisvalid AND i.indisready) THEN RAISE EXCEPTION 'Prepare concurrent indexes before migrating'; END IF;
IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='transactions_group_keyset_idx' AND i.indisvalid AND i.indisready) THEN RAISE EXCEPTION 'Prepare concurrent indexes before migrating'; END IF;
IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='transactions_group_user_keyset_idx' AND i.indisvalid AND i.indisready) THEN RAISE EXCEPTION 'Prepare concurrent indexes before migrating'; END IF;
IF NOT EXISTS(SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='transactions_group_transfer_keyset_idx' AND i.indisvalid AND i.indisready) THEN RAISE EXCEPTION 'Prepare concurrent indexes before migrating'; END IF;
END $$;
-- categories_key_key retains the same UNIQUE(key) constraint.
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.categories'::regclass AND conname='categories_key_key' AND contype='u') THEN RAISE EXCEPTION 'Category uniqueness must remain enforced'; END IF; END $$;
DROP INDEX public.idx_categories_key_unique;
