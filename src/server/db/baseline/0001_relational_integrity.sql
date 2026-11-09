SET LOCAL ROLE postgres;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
-- Expansion/backfill is one transaction. Aggregate diagnostics contain no IDs or records.
LOCK TABLE users, groups, accounts, budgets, recurring_transactions, transactions, categories IN SHARE ROW EXCLUSIVE MODE;
DO $$
DECLARE issues jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user_group', (SELECT count(*) FROM users u LEFT JOIN groups g ON g.id=u.group_id WHERE u.group_id IS NOT NULL AND g.id IS NULL),
    'account_group', (SELECT count(*) FROM accounts a LEFT JOIN groups g ON g.id=a.group_id WHERE g.id IS NULL),
    'account_members', (SELECT count(*) FROM accounts a CROSS JOIN LATERAL unnest(a.user_ids) x(id) LEFT JOIN users u ON u.id=x.id AND u.group_id=a.group_id WHERE u.id IS NULL),
    'account_duplicates', (SELECT count(*) FROM accounts a WHERE cardinality(a.user_ids)<>(SELECT count(DISTINCT x.member_id) FROM unnest(a.user_ids) x(member_id))),
    'recurring_member_ids', (SELECT count(*) FROM recurring_transactions r CROSS JOIN LATERAL unnest(r.user_ids) x(member_id) WHERE x.member_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
    'budget_categories_type', (SELECT count(*) FROM budgets WHERE jsonb_typeof(categories)<>'array'),
    'transaction_accounts', (SELECT count(*) FROM transactions t LEFT JOIN accounts a ON a.id=t.account_id AND a.group_id=t.group_id LEFT JOIN accounts d ON d.id=t.to_account_id AND d.group_id=t.group_id WHERE a.id IS NULL OR (t.to_account_id IS NOT NULL AND d.id IS NULL)),
    'transaction_categories', (SELECT count(*) FROM transactions t LEFT JOIN categories c ON c.key=t.category AND c.group_id IN(t.group_id,'00000000-0000-0000-0000-000000000000'::uuid) WHERE t.category<>'' AND c.id IS NULL),
    'transaction_owners', (SELECT count(*) FROM transactions t LEFT JOIN users u ON u.id=t.user_id AND u.group_id=t.group_id WHERE t.user_id IS NOT NULL AND u.id IS NULL),
    'budget_owners', (SELECT count(*) FROM budgets b LEFT JOIN users u ON u.id=b.user_id AND u.group_id=b.group_id WHERE u.id IS NULL),
    'notification_transaction', (SELECT count(*) FROM bank_notification_events e LEFT JOIN transactions t ON t.id=e.transaction_id AND t.group_id=e.group_id WHERE e.transaction_id IS NOT NULL AND t.id IS NULL)
  ) INTO issues;
  IF EXISTS(SELECT 1 FROM jsonb_each_text(issues) x WHERE x.value::bigint>0) THEN
    RAISE EXCEPTION 'Relational preflight failed: %', issues;
  END IF;
  SELECT jsonb_build_object(
    'recurring_members', (SELECT count(*) FROM recurring_transactions r JOIN accounts a ON a.id=r.account_id CROSS JOIN LATERAL unnest(r.user_ids) x(id) LEFT JOIN users u ON u.id=x.id::uuid AND u.group_id=a.group_id WHERE u.id IS NULL),
    'recurring_duplicates', (SELECT count(*) FROM recurring_transactions r WHERE cardinality(r.user_ids)<>(SELECT count(DISTINCT x.member_id) FROM unnest(r.user_ids) x(member_id))),
    'budget_categories', (SELECT count(*) FROM budgets b CROSS JOIN LATERAL jsonb_array_elements_text(b.categories) x(key) LEFT JOIN categories c ON c.key=x.key AND c.group_id IN (b.group_id,'00000000-0000-0000-0000-000000000000'::uuid) WHERE c.id IS NULL),
    'budget_category_duplicates', (SELECT count(*) FROM budgets b WHERE jsonb_array_length(b.categories)<>(SELECT count(DISTINCT key) FROM jsonb_array_elements_text(b.categories) key))
  ) INTO issues;
  IF EXISTS(SELECT 1 FROM jsonb_each_text(issues) x WHERE x.value::bigint>0) THEN
    RAISE EXCEPTION 'Association preflight failed: %', issues;
  END IF;
END $$;

ALTER TABLE users ADD CONSTRAINT users_group_id_fkey FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT users_id_group_unique UNIQUE(id, group_id);
ALTER TABLE accounts ADD CONSTRAINT accounts_group_id_fkey FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE accounts ADD CONSTRAINT accounts_id_group_unique UNIQUE(id, group_id);
ALTER TABLE budgets ADD CONSTRAINT budgets_user_group_fkey FOREIGN KEY(user_id,group_id) REFERENCES users(id,group_id) ON DELETE CASCADE;
ALTER TABLE budgets ADD CONSTRAINT budgets_group_id_fkey FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE transactions ADD CONSTRAINT transactions_account_group_fkey FOREIGN KEY(account_id,group_id) REFERENCES accounts(id,group_id);
ALTER TABLE transactions ADD CONSTRAINT transactions_destination_group_fkey FOREIGN KEY(to_account_id,group_id) REFERENCES accounts(id,group_id);
ALTER TABLE transactions ADD CONSTRAINT transactions_user_group_fkey FOREIGN KEY(user_id,group_id) REFERENCES users(id,group_id) ON DELETE CASCADE;
ALTER TABLE bank_notification_events ADD CONSTRAINT bank_events_transaction_fkey FOREIGN KEY(transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;
ALTER TABLE bank_connections ADD CONSTRAINT bank_connections_account_group_fkey FOREIGN KEY(account_id,group_id) REFERENCES accounts(id,group_id) ON DELETE CASCADE;
ALTER TABLE bank_notification_events ADD CONSTRAINT bank_events_account_group_fkey FOREIGN KEY(account_id,group_id) REFERENCES accounts(id,group_id) ON DELETE CASCADE;
ALTER TABLE transactions ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE portfolio_value_snapshots ADD CONSTRAINT portfolio_value_snapshots_pkey PRIMARY KEY USING INDEX portfolio_value_snapshots_user_date_unique;

CREATE TABLE account_users (
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK(position>0),
  PRIMARY KEY(account_id,user_id), UNIQUE(account_id,position)
);
CREATE INDEX account_users_user ON account_users(user_id,account_id);
CREATE TABLE recurring_users (
  recurring_id uuid NOT NULL REFERENCES recurring_transactions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK(position>0),
  PRIMARY KEY(recurring_id,user_id), UNIQUE(recurring_id,position)
);
CREATE INDEX recurring_users_user ON recurring_users(user_id,recurring_id);
CREATE TABLE budget_categories (
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_key text NOT NULL REFERENCES categories(key),
  position integer NOT NULL CHECK(position>0),
  PRIMARY KEY(budget_id,category_key), UNIQUE(budget_id,position)
);
CREATE INDEX budget_categories_category ON budget_categories(category_key,budget_id);
ALTER TABLE account_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON account_users,recurring_users,budget_categories FROM PUBLIC,anon,authenticated;
GRANT ALL ON account_users,recurring_users,budget_categories TO pool_user,service_role;

INSERT INTO account_users SELECT a.id,x.id,x.position FROM accounts a CROSS JOIN LATERAL unnest(a.user_ids) WITH ORDINALITY x(id,position);
INSERT INTO recurring_users SELECT r.id,x.id::uuid,x.position FROM recurring_transactions r CROSS JOIN LATERAL unnest(r.user_ids) WITH ORDINALITY x(id,position);
INSERT INTO budget_categories SELECT b.id,x.key,x.position FROM budgets b CROSS JOIN LATERAL jsonb_array_elements_text(b.categories) WITH ORDINALITY x(key,position);

CREATE FUNCTION guard_association_scope() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE expected_group uuid; actual_group uuid;
BEGIN
  IF TG_TABLE_NAME='account_users' THEN
    SELECT group_id INTO expected_group FROM public.accounts WHERE id=NEW.account_id FOR KEY SHARE;
  ELSIF TG_TABLE_NAME='recurring_users' THEN
    SELECT a.group_id INTO expected_group FROM public.recurring_transactions r JOIN public.accounts a ON a.id=r.account_id WHERE r.id=NEW.recurring_id FOR KEY SHARE OF r,a;
  ELSE
    SELECT group_id INTO expected_group FROM public.budgets WHERE id=NEW.budget_id FOR KEY SHARE;
    SELECT group_id INTO actual_group FROM public.categories WHERE key=NEW.category_key FOR KEY SHARE;
    IF actual_group='00000000-0000-0000-0000-000000000000'::uuid THEN RETURN NEW; END IF;
  END IF;
  IF TG_TABLE_NAME IN ('account_users','recurring_users') THEN
    SELECT group_id INTO actual_group FROM public.users WHERE id=NEW.user_id FOR KEY SHARE;
  END IF;
  IF expected_group IS NULL OR actual_group IS DISTINCT FROM expected_group THEN
    RAISE EXCEPTION 'Association outside authorized group' USING ERRCODE='23503';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER account_users_scope BEFORE INSERT OR UPDATE ON account_users FOR EACH ROW EXECUTE FUNCTION guard_association_scope();
CREATE TRIGGER recurring_users_scope BEFORE INSERT OR UPDATE ON recurring_users FOR EACH ROW EXECUTE FUNCTION guard_association_scope();
CREATE TRIGGER budget_categories_scope BEFORE INSERT OR UPDATE ON budget_categories FOR EACH ROW EXECUTE FUNCTION guard_association_scope();

CREATE FUNCTION guard_membership_group_change() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF NEW.group_id IS NOT DISTINCT FROM OLD.group_id THEN RETURN NEW; END IF;
  -- A parent group's cascade owns removal of all of its financial resources.
  IF NOT EXISTS(SELECT 1 FROM public.groups WHERE id=OLD.group_id) THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME='users' THEN
    IF EXISTS(SELECT 1 FROM public.account_users x JOIN public.accounts a ON a.id=x.account_id WHERE x.user_id=OLD.id AND a.group_id IS DISTINCT FROM NEW.group_id)
      OR EXISTS(SELECT 1 FROM public.recurring_users x JOIN public.recurring_transactions r ON r.id=x.recurring_id JOIN public.accounts a ON a.id=r.account_id WHERE x.user_id=OLD.id AND a.group_id IS DISTINCT FROM NEW.group_id) THEN
      RAISE EXCEPTION 'User still owns resources in the previous group' USING ERRCODE='23503';
    END IF;
  ELSE
    IF EXISTS(SELECT 1 FROM public.budget_categories x JOIN public.budgets b ON b.id=x.budget_id WHERE x.category_key=OLD.key AND NEW.group_id NOT IN (b.group_id,'00000000-0000-0000-0000-000000000000'::uuid)) THEN
      RAISE EXCEPTION 'Category still referenced in the previous group' USING ERRCODE='23503';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER users_membership_scope BEFORE UPDATE OF group_id ON users FOR EACH ROW EXECUTE FUNCTION guard_membership_group_change();
CREATE TRIGGER categories_membership_scope BEFORE UPDATE OF group_id ON categories FOR EACH ROW EXECUTE FUNCTION guard_membership_group_change();

-- One-way compatibility bridge: legacy commands remain usable during rollout.
-- The PKs reject duplicates instead of silently discarding them.
CREATE FUNCTION sync_legacy_associations() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF TG_TABLE_NAME='accounts' THEN
    DELETE FROM public.account_users WHERE account_id=NEW.id;
    INSERT INTO public.account_users SELECT NEW.id,x.id,x.position FROM unnest(NEW.user_ids) WITH ORDINALITY x(id,position);
  ELSIF TG_TABLE_NAME='recurring_transactions' THEN
    DELETE FROM public.recurring_users WHERE recurring_id=NEW.id;
    INSERT INTO public.recurring_users SELECT NEW.id,x.id::uuid,x.position FROM unnest(NEW.user_ids) WITH ORDINALITY x(id,position);
  ELSE
    DELETE FROM public.budget_categories WHERE budget_id=NEW.id;
    INSERT INTO public.budget_categories SELECT NEW.id,x.key,x.position FROM jsonb_array_elements_text(NEW.categories) WITH ORDINALITY x(key,position);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER accounts_associations AFTER INSERT OR UPDATE OF user_ids,group_id ON accounts FOR EACH ROW EXECUTE FUNCTION sync_legacy_associations();
CREATE TRIGGER recurring_associations AFTER INSERT OR UPDATE OF user_ids,account_id ON recurring_transactions FOR EACH ROW EXECUTE FUNCTION sync_legacy_associations();
CREATE TRIGGER budgets_associations AFTER INSERT OR UPDATE OF categories,group_id ON budgets FOR EACH ROW EXECUTE FUNCTION sync_legacy_associations();

CREATE FUNCTION verify_association_backfill() RETURNS void LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.accounts a WHERE a.user_ids IS DISTINCT FROM coalesce((SELECT array_agg(x.user_id ORDER BY x.position) FROM public.account_users x WHERE x.account_id=a.id),ARRAY[]::uuid[]))
    OR EXISTS(SELECT 1 FROM public.recurring_transactions r WHERE r.user_ids IS DISTINCT FROM coalesce((SELECT array_agg(x.user_id::text ORDER BY x.position) FROM public.recurring_users x WHERE x.recurring_id=r.id),ARRAY[]::text[]))
    OR EXISTS(SELECT 1 FROM public.budgets b WHERE b.categories IS DISTINCT FROM coalesce((SELECT jsonb_agg(x.category_key ORDER BY x.position) FROM public.budget_categories x WHERE x.budget_id=b.id),'[]'::jsonb)) THEN
    RAISE EXCEPTION 'Association backfill differs from source';
  END IF;
END $$;
SELECT verify_association_backfill();
REVOKE ALL ON FUNCTION guard_association_scope(),sync_legacy_associations(),verify_association_backfill(),guard_membership_group_change() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION guard_association_scope(),sync_legacy_associations(),guard_membership_group_change() TO pool_user,service_role;
REVOKE CREATE ON SCHEMA public FROM pool_user;

-- Database enforcement covers direct commands and prevents cross-tenant category references.
CREATE FUNCTION guard_financial_category_scope() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE target_group uuid; category_group uuid;
BEGIN
  IF NEW.category IS NULL OR NEW.category='' THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME='recurring_transactions' THEN
    SELECT group_id INTO target_group FROM public.accounts WHERE id=NEW.account_id FOR KEY SHARE;
  ELSE target_group:=NEW.group_id; END IF;
  SELECT group_id INTO category_group FROM public.categories WHERE key=NEW.category FOR KEY SHARE;
  IF category_group IS NULL OR category_group NOT IN(target_group,'00000000-0000-0000-0000-000000000000'::uuid) THEN
    RAISE EXCEPTION 'Category outside authorized group' USING ERRCODE='23503';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER transactions_category_scope BEFORE INSERT OR UPDATE OF category,group_id ON transactions FOR EACH ROW EXECUTE FUNCTION guard_financial_category_scope();
CREATE TRIGGER recurring_category_scope BEFORE INSERT OR UPDATE OF category,account_id ON recurring_transactions FOR EACH ROW EXECUTE FUNCTION guard_financial_category_scope();
CREATE TRIGGER bank_rules_category_scope BEFORE INSERT OR UPDATE OF category,group_id ON bank_merchant_rules FOR EACH ROW EXECUTE FUNCTION guard_financial_category_scope();
CREATE TRIGGER bank_events_category_scope BEFORE INSERT OR UPDATE OF category,group_id ON bank_notification_events FOR EACH ROW EXECUTE FUNCTION guard_financial_category_scope();
REVOKE ALL ON FUNCTION guard_financial_category_scope() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION guard_financial_category_scope() TO pool_user,service_role;
