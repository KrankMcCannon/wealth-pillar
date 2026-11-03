-- PR #58: execute only 0007_bank_notifications and 0008_category_reference_guards.
-- Run the entire file in Supabase SQL Editor as the project database owner.
-- This is an execution bundle, not a new migration. It does not baseline history.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
SELECT pg_advisory_xact_lock(hashtext('wealth-pillar:pr58:migrations'));
DO $$
BEGIN
  IF to_regclass('public.bank_connections') IS NOT NULL
     OR to_regclass('public.bank_notification_events') IS NOT NULL
     OR to_regclass('public.bank_merchant_rules') IS NOT NULL
     OR to_regprocedure('public.category_reference_keys(uuid)') IS NOT NULL
     OR to_regprocedure('public.guard_category_reference()') IS NOT NULL
     OR to_regprocedure('public.guard_category_delete()') IS NOT NULL THEN
    RAISE EXCEPTION 'PR58 objects already exist: verify which migration is installed before proceeding. No changes were applied.';
  END IF;
END $$;

-- SOURCE: src/server/db/drizzle/0007_bank_notifications.sql
CREATE TABLE "bank_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"provider" text DEFAULT 'revolut' NOT NULL,
	"token_hash" text NOT NULL,
	"default_category" text NOT NULL,
	"auto_import" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"rate_window" timestamp with time zone DEFAULT now() NOT NULL,
	"rate_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_connections_token_hash_unique" UNIQUE("token_hash")
);


ALTER TABLE "bank_connections" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "bank_merchant_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"merchant" text NOT NULL,
	"category" text NOT NULL
);


ALTER TABLE "bank_merchant_rules" ENABLE ROW LEVEL SECURITY;

CREATE TABLE "bank_notification_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"fingerprint" text NOT NULL,
	"payload" jsonb,
	"parsed" jsonb,
	"category" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text,
	"transaction_id" uuid,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_notification_status" CHECK ("bank_notification_events"."status" IN ('pending','imported','ignored'))
);


ALTER TABLE "bank_notification_events" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "bank_merchant_rules" ADD CONSTRAINT "bank_merchant_rules_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "bank_merchant_rules" ADD CONSTRAINT "bank_merchant_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "bank_notification_events" ADD CONSTRAINT "bank_notification_events_connection_id_bank_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."bank_connections"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "bank_notification_events" ADD CONSTRAINT "bank_notification_events_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "bank_notification_events" ADD CONSTRAINT "bank_notification_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "bank_notification_events" ADD CONSTRAINT "bank_notification_events_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "bank_connections_owner" ON "bank_connections" USING btree ("user_id","group_id");

CREATE UNIQUE INDEX "bank_merchant_rule_identity" ON "bank_merchant_rules" USING btree ("group_id","user_id","provider","merchant");

CREATE UNIQUE INDEX "bank_notification_identity" ON "bank_notification_events" USING btree ("account_id","fingerprint");

CREATE INDEX "bank_notification_inbox" ON "bank_notification_events" USING btree ("user_id","group_id","received_at");


-- Device credentials and notification payloads are accessible only to backend roles.
DO $$
DECLARE client_role text;
BEGIN
  REVOKE ALL ON bank_connections, bank_notification_events, bank_merchant_rules FROM PUBLIC;
  FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
      EXECUTE format('REVOKE ALL ON bank_connections, bank_notification_events, bank_merchant_rules FROM %I', client_role);
    END IF;
  END LOOP;
  FOREACH client_role IN ARRAY ARRAY['pool_user', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
      EXECUTE format('GRANT ALL ON bank_connections, bank_notification_events, bank_merchant_rules TO %I', client_role);
    END IF;
  END LOOP;
END $$;


-- SOURCE: src/server/db/drizzle/0008_category_reference_guards.sql
-- Durable category keys behave like foreign keys, including JSON budget references.
-- Existing rows are preserved. Guards apply to new or changed references.
CREATE FUNCTION public.category_reference_keys(p_group_id uuid)
RETURNS TABLE(category_key text) LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT DISTINCT key FROM (
    SELECT t.category AS key FROM public.transactions t WHERE p_group_id IS NULL OR t.group_id = p_group_id
    UNION ALL
    SELECT jsonb_array_elements_text(b.categories) FROM public.budgets b WHERE p_group_id IS NULL OR b.group_id = p_group_id
    UNION ALL
    SELECT r.category FROM public.recurring_transactions r JOIN public.accounts a ON a.id = r.account_id WHERE p_group_id IS NULL OR a.group_id = p_group_id
    UNION ALL
    SELECT jsonb_object_keys(coalesce(p.category_spending, '{}'::jsonb)) FROM public.budget_periods p JOIN public.users u ON u.id = p.user_id WHERE p_group_id IS NULL OR coalesce(p.group_id, u.group_id) = p_group_id
    UNION ALL
    SELECT jsonb_array_elements_text(coalesce(b.item->'categories', '[]'::jsonb)) FROM public.budget_periods p JOIN public.users u ON u.id = p.user_id CROSS JOIN LATERAL jsonb_array_elements(coalesce(p.budgets_snapshot, '[]'::jsonb)) b(item) WHERE p_group_id IS NULL OR coalesce(p.group_id, u.group_id) = p_group_id
    UNION ALL
    SELECT c.default_category FROM public.bank_connections c WHERE p_group_id IS NULL OR c.group_id = p_group_id
    UNION ALL
    SELECT e.category FROM public.bank_notification_events e WHERE p_group_id IS NULL OR e.group_id = p_group_id
    UNION ALL
    SELECT r.category FROM public.bank_merchant_rules r WHERE p_group_id IS NULL OR r.group_id = p_group_id
  ) refs WHERE key IS NOT NULL AND key <> '';
$$;


CREATE FUNCTION public.guard_category_reference() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  reference_keys text[];
  reference_key text;
  current_row jsonb := to_jsonb(NEW);
  previous_row jsonb := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'budgets' AND (current_row->'categories') IS NOT DISTINCT FROM (previous_row->'categories') THEN RETURN NEW; END IF;
    IF TG_TABLE_NAME = 'budget_periods' AND (current_row->'budgets_snapshot') IS NOT DISTINCT FROM (previous_row->'budgets_snapshot') AND (current_row->'category_spending') IS NOT DISTINCT FROM (previous_row->'category_spending') THEN RETURN NEW; END IF;
    IF TG_TABLE_NAME = 'bank_connections' AND (current_row->>'default_category') IS NOT DISTINCT FROM (previous_row->>'default_category') THEN RETURN NEW; END IF;
    IF TG_TABLE_NAME NOT IN ('budgets', 'budget_periods', 'bank_connections') AND (current_row->>'category') IS NOT DISTINCT FROM (previous_row->>'category') THEN RETURN NEW; END IF;
  END IF;
  IF TG_TABLE_NAME = 'budgets' THEN
    SELECT array_agg(k) INTO reference_keys FROM jsonb_array_elements_text((current_row->'categories')) k;
  ELSIF TG_TABLE_NAME = 'budget_periods' THEN
    SELECT array_agg(k) INTO reference_keys FROM (
      SELECT jsonb_object_keys(coalesce(nullif(current_row->'category_spending', 'null'::jsonb), '{}'::jsonb)) k
      UNION SELECT jsonb_array_elements_text(coalesce(b->'categories', '[]'::jsonb)) FROM jsonb_array_elements(coalesce(nullif(current_row->'budgets_snapshot', 'null'::jsonb), '[]'::jsonb)) b
    ) keys;
  ELSIF TG_TABLE_NAME = 'bank_connections' THEN
    reference_keys := ARRAY[(current_row->>'default_category')];
  ELSE
    reference_keys := ARRAY[(current_row->>'category')];
  END IF;
  -- Same ordering for multiple keys. KEY SHARE conflicts with category deletion.
  FOR reference_key IN SELECT DISTINCT k FROM unnest(reference_keys) k WHERE k IS NOT NULL AND k <> '' ORDER BY k LOOP
    PERFORM 1 FROM public.categories WHERE key = reference_key FOR KEY SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Category reference is unavailable' USING ERRCODE = '23503'; END IF;
  END LOOP;
  RETURN NEW;
END;
$$;


CREATE FUNCTION public.guard_category_delete() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  -- The parent group's removal already owns the lifecycle of its cascading data.
  IF pg_trigger_depth() > 1 AND NOT EXISTS (SELECT 1 FROM public.groups WHERE id = OLD.group_id) THEN RETURN OLD; END IF;
  IF EXISTS (SELECT 1 FROM public.category_reference_keys(NULL) WHERE category_key = OLD.key) THEN
    RAISE EXCEPTION 'CATEGORY_IN_USE' USING ERRCODE = '23503';
  END IF;
  RETURN OLD;
END;
$$;


CREATE TRIGGER category_delete_guard BEFORE DELETE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.guard_category_delete();


CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.guard_category_reference();


CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.guard_category_reference();


CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.recurring_transactions FOR EACH ROW EXECUTE FUNCTION public.guard_category_reference();


CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.budget_periods FOR EACH ROW EXECUTE FUNCTION public.guard_category_reference();


CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.bank_connections FOR EACH ROW EXECUTE FUNCTION public.guard_category_reference();


CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.bank_notification_events FOR EACH ROW EXECUTE FUNCTION public.guard_category_reference();


CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.bank_merchant_rules FOR EACH ROW EXECUTE FUNCTION public.guard_category_reference();


REVOKE ALL ON FUNCTION public.category_reference_keys(uuid), public.guard_category_reference(), public.guard_category_delete() FROM PUBLIC;


DO $$
DECLARE role_name text;
BEGIN
  FOR role_name IN SELECT rolname FROM pg_roles WHERE rolname IN ('pool_user', 'service_role') LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.category_reference_keys(uuid), public.guard_category_reference(), public.guard_category_delete() TO %I', role_name);
  END LOOP;
END $$;

DO $$
DECLARE installed_triggers integer;
BEGIN
  SELECT count(*) INTO installed_triggers
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND NOT t.tgisinternal AND t.tgenabled = 'O'
    AND ((c.relname = 'categories' AND t.tgname = 'category_delete_guard')
      OR (c.relname IN ('transactions','budgets','recurring_transactions','budget_periods',
                       'bank_connections','bank_notification_events','bank_merchant_rules')
          AND t.tgname = 'category_reference_guard'));
  IF installed_triggers <> 8 THEN
    RAISE EXCEPTION 'Expected 8 category guards, found %. All changes will roll back.', installed_triggers;
  END IF;
END $$;
COMMIT;

SELECT to_regclass('public.bank_connections')::text AS bank_connections,
       to_regclass('public.bank_notification_events')::text AS bank_notification_events,
       to_regclass('public.bank_merchant_rules')::text AS bank_merchant_rules,
       to_regprocedure('public.category_reference_keys(uuid)')::text AS category_reference_keys;
