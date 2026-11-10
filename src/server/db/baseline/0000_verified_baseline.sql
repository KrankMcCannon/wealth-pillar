-- Generated from catalog-only metadata. No application records or credentials.

-- PostgreSQL 17; platform prerequisites: postgres/pool_user/service_role/anon/authenticated roles, auth.uid(), auth.jwt().

SET LOCAL ROLE postgres;

ALTER SCHEMA public OWNER TO pg_database_owner;

SET LOCAL check_function_bodies = off;

SET LOCAL search_path = public, extensions;

CREATE SCHEMA IF NOT EXISTS extensions;

CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

REVOKE ALL ON SCHEMA public FROM PUBLIC, anon, authenticated;

CREATE TABLE public."accounts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "user_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
  "group_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "balance" numeric(12,2) DEFAULT 0,
  "liquidity" text,
  "balance_version" bigint DEFAULT 0 NOT NULL
);

CREATE TABLE public."available_shares" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "symbol" character varying(20) NOT NULL,
  "name" character varying(255) NOT NULL,
  "region" character varying(50) NOT NULL,
  "asset_type" character varying(50) NOT NULL,
  "exchange" character varying(50),
  "currency" character varying(10),
  "is_popular" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."bank_connections" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "group_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "name" text NOT NULL,
  "provider" text DEFAULT 'revolut'::text NOT NULL,
  "token_hash" text NOT NULL,
  "auto_import" boolean DEFAULT false NOT NULL,
  "revoked_at" timestamp with time zone,
  "last_used_at" timestamp with time zone,
  "rate_window" timestamp with time zone DEFAULT now() NOT NULL,
  "rate_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."bank_merchant_rules" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "group_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "provider" text NOT NULL,
  "merchant" text NOT NULL,
  "category" text NOT NULL
);

CREATE TABLE public."bank_notification_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "connection_id" uuid NOT NULL,
  "group_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "fingerprint" text NOT NULL,
  "payload" jsonb,
  "parsed" jsonb,
  "category" text,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "reason" text,
  "transaction_id" uuid,
  "received_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."budget_periods" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date,
  "is_active" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "group_id" uuid,
  "spendable_spent" numeric,
  "reserve_saved" numeric,
  "category_spending" jsonb DEFAULT '{}'::jsonb,
  "snapshot_at" timestamp with time zone,
  "budgets_snapshot" jsonb
);

CREATE TABLE public."budgets" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "description" text NOT NULL,
  "amount" numeric(10,2) NOT NULL,
  "type" text DEFAULT 'monthly'::text NOT NULL,
  "icon" text,
  "categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "group_id" uuid
);

CREATE TABLE public."categories" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "key" text NOT NULL,
  "label" text NOT NULL,
  "icon" text NOT NULL,
  "color" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "group_id" uuid NOT NULL
);

CREATE TABLE public."group_invitations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "group_id" uuid NOT NULL,
  "invited_by_user_id" uuid NOT NULL,
  "email" character varying(255) NOT NULL,
  "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
  "invitation_token" character varying(255) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "accepted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."groups" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "user_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
  "plan" jsonb DEFAULT '{"name": "Piano Gratuito", "type": "free"}'::jsonb NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "subscription_status" character varying(20) DEFAULT 'free'::character varying,
  "subscription_expires_at" timestamp with time zone,
  "stripe_customer_id" character varying(255),
  "stripe_subscription_id" character varying(255)
);

CREATE TABLE public."investments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "symbol" text NOT NULL,
  "amount" numeric(15,2) NOT NULL,
  "shares_acquired" numeric(15,6) NOT NULL,
  "currency" character varying(3) NOT NULL,
  "currency_rate" numeric(10,6) DEFAULT 1.0 NOT NULL,
  "tax_paid" numeric(15,2) DEFAULT 0.0 NOT NULL,
  "net_earn" numeric(15,2) DEFAULT 0.0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."market_data_cache" (
  "symbol" text NOT NULL,
  "data" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "last_updated" timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public."orphan_users" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "clerk_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."portfolio_value_snapshots" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "snapshot_date" date NOT NULL,
  "value" numeric(15,2) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE public."recurring_transactions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "description" text NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "type" character varying(50) NOT NULL,
  "account_id" uuid NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date,
  "frequency" character varying(20) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "total_executions" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "category" text NOT NULL,
  "transaction_ids" uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
  "due_day" integer DEFAULT 1 NOT NULL,
  "user_ids" text[] NOT NULL
);

CREATE TABLE public."transactions" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "description" text NOT NULL,
  "amount" numeric(15,2) NOT NULL,
  "type" character varying(10) NOT NULL,
  "category" character varying(255) NOT NULL,
  "date" date NOT NULL,
  "account_id" uuid NOT NULL,
  "to_account_id" uuid,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "user_id" uuid,
  "group_id" uuid,
  "recurring_series_id" uuid,
  "frequency" character varying(20),
  "import_hash" text
);

CREATE TABLE public."user_preferences" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "currency" character varying(3) DEFAULT 'EUR'::character varying NOT NULL,
  "language" character varying(5) DEFAULT 'it-IT'::character varying NOT NULL,
  "timezone" character varying(50) DEFAULT 'Europe/Rome'::character varying NOT NULL,
  "notifications_push" boolean DEFAULT true NOT NULL,
  "notifications_email" boolean DEFAULT false NOT NULL,
  "notifications_budget_alerts" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."users" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "clerk_id" text,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "avatar" text DEFAULT ''::text,
  "theme_color" text DEFAULT '#3B82F6'::text,
  "budget_start_date" integer DEFAULT 1,
  "group_id" uuid,
  "role" text DEFAULT 'member'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "default_account_id" uuid
);

ALTER TABLE public."accounts" ADD CONSTRAINT "accounts_pkey" PRIMARY KEY (id);

ALTER TABLE public."available_shares" ADD CONSTRAINT "available_shares_pkey" PRIMARY KEY (id);

ALTER TABLE public."bank_connections" ADD CONSTRAINT "bank_connections_pkey" PRIMARY KEY (id);

ALTER TABLE public."bank_merchant_rules" ADD CONSTRAINT "bank_merchant_rules_pkey" PRIMARY KEY (id);

ALTER TABLE public."bank_notification_events" ADD CONSTRAINT "bank_notification_events_pkey" PRIMARY KEY (id);

ALTER TABLE public."budget_periods" ADD CONSTRAINT "budget_periods_pkey" PRIMARY KEY (id);

ALTER TABLE public."budgets" ADD CONSTRAINT "budgets_pkey" PRIMARY KEY (id);

ALTER TABLE public."categories" ADD CONSTRAINT "categories_pkey" PRIMARY KEY (id);

ALTER TABLE public."group_invitations" ADD CONSTRAINT "group_invitations_pkey" PRIMARY KEY (id);

ALTER TABLE public."groups" ADD CONSTRAINT "groups_pkey" PRIMARY KEY (id);

ALTER TABLE public."investments" ADD CONSTRAINT "investments_pkey" PRIMARY KEY (id);

ALTER TABLE public."market_data_cache" ADD CONSTRAINT "market_data_cache_pkey" PRIMARY KEY (symbol);

ALTER TABLE public."orphan_users" ADD CONSTRAINT "orphan_users_pkey" PRIMARY KEY (id);

ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY (id);

ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_pkey" PRIMARY KEY (id);

ALTER TABLE public."user_preferences" ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY (id);

ALTER TABLE public."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY (id);

ALTER TABLE public."available_shares" ADD CONSTRAINT "available_shares_symbol_key" UNIQUE (symbol);

ALTER TABLE public."bank_connections" ADD CONSTRAINT "bank_connections_token_hash_unique" UNIQUE (token_hash);

ALTER TABLE public."categories" ADD CONSTRAINT "categories_key_key" UNIQUE (key);

ALTER TABLE public."group_invitations" ADD CONSTRAINT "group_invitations_invitation_token_key" UNIQUE (invitation_token);

ALTER TABLE public."user_preferences" ADD CONSTRAINT "user_preferences_user_id_key" UNIQUE (user_id);

ALTER TABLE public."users" ADD CONSTRAINT "users_clerk_id_key" UNIQUE (clerk_id);

ALTER TABLE public."users" ADD CONSTRAINT "users_email_key" UNIQUE (email);

ALTER TABLE public."accounts" ADD CONSTRAINT "accounts_type_check" CHECK ((type = ANY (ARRAY['payroll'::text, 'savings'::text, 'cash'::text, 'investments'::text])));

ALTER TABLE public."bank_notification_events" ADD CONSTRAINT "bank_notification_status" CHECK ((status = ANY (ARRAY['pending'::text, 'imported'::text, 'ignored'::text])));

ALTER TABLE public."budgets" ADD CONSTRAINT "budgets_amount_check" CHECK ((amount >= (0)::numeric));

ALTER TABLE public."budgets" ADD CONSTRAINT "budgets_type_check" CHECK ((type = ANY (ARRAY['monthly'::text, 'annually'::text])));

ALTER TABLE public."group_invitations" ADD CONSTRAINT "check_email_format" CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text));

ALTER TABLE public."group_invitations" ADD CONSTRAINT "check_status" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[])));

ALTER TABLE public."groups" ADD CONSTRAINT "check_subscription_status" CHECK (((subscription_status)::text = ANY ((ARRAY['free'::character varying, 'active'::character varying, 'cancelled'::character varying, 'past_due'::character varying, 'unpaid'::character varying])::text[])));

ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "due_day_range" CHECK (((due_day >= 1) AND (due_day <= 31)));

ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_transactions_frequency_check" CHECK (((frequency)::text = ANY (ARRAY[('once'::character varying)::text, ('weekly'::character varying)::text, ('biweekly'::character varying)::text, ('monthly'::character varying)::text, ('yearly'::character varying)::text])));

ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_transactions_type_check" CHECK (((type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying, 'transfer'::character varying])::text[])));

ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_frequency_check" CHECK (((frequency)::text = ANY ((ARRAY['once'::character varying, 'weekly'::character varying, 'biweekly'::character varying, 'monthly'::character varying, 'yearly'::character varying])::text[])));

ALTER TABLE public."transactions" ADD CONSTRAINT "transactions_type_check" CHECK (((type)::text = ANY ((ARRAY['income'::character varying, 'expense'::character varying, 'transfer'::character varying])::text[])));

ALTER TABLE public."users" ADD CONSTRAINT "users_budget_start_date_check" CHECK (((budget_start_date >= 1) AND (budget_start_date <= 31)));

ALTER TABLE public."users" ADD CONSTRAINT "users_role_check" CHECK ((role = ANY (ARRAY['superadmin'::text, 'admin'::text, 'member'::text])));

ALTER TABLE public."bank_connections" ADD CONSTRAINT "bank_connections_account_id_accounts_id_fk" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE public."bank_connections" ADD CONSTRAINT "bank_connections_group_id_groups_id_fk" FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE public."bank_connections" ADD CONSTRAINT "bank_connections_user_id_users_id_fk" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."bank_merchant_rules" ADD CONSTRAINT "bank_merchant_rules_group_id_groups_id_fk" FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE public."bank_merchant_rules" ADD CONSTRAINT "bank_merchant_rules_user_id_users_id_fk" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."bank_notification_events" ADD CONSTRAINT "bank_notification_events_account_id_accounts_id_fk" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE public."bank_notification_events" ADD CONSTRAINT "bank_notification_events_connection_id_bank_connections_id_fk" FOREIGN KEY (connection_id) REFERENCES bank_connections(id) ON DELETE CASCADE;

ALTER TABLE public."bank_notification_events" ADD CONSTRAINT "bank_notification_events_group_id_groups_id_fk" FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE public."bank_notification_events" ADD CONSTRAINT "bank_notification_events_user_id_users_id_fk" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."budget_periods" ADD CONSTRAINT "budget_periods_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."categories" ADD CONSTRAINT "categories_group_id_fkey" FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE public."group_invitations" ADD CONSTRAINT "group_invitations_group_id_fkey" FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE public."group_invitations" ADD CONSTRAINT "group_invitations_invited_by_user_id_fkey" FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."investments" ADD CONSTRAINT "investments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."portfolio_value_snapshots" ADD CONSTRAINT "portfolio_value_snapshots_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."recurring_transactions" ADD CONSTRAINT "recurring_transactions_account_id_fkey" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE public."transactions" ADD CONSTRAINT "fk_transactions_group_id" FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE public."transactions" ADD CONSTRAINT "fk_transactions_recurring_series_id" FOREIGN KEY (recurring_series_id) REFERENCES recurring_transactions(id) ON DELETE SET NULL;

ALTER TABLE public."transactions" ADD CONSTRAINT "fk_transactions_user_id" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE public."users" ADD CONSTRAINT "users_default_account_id_fkey" FOREIGN KEY (default_account_id) REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX bank_connections_owner ON public.bank_connections USING btree (user_id, group_id);

CREATE UNIQUE INDEX bank_merchant_rule_identity ON public.bank_merchant_rules USING btree (group_id, user_id, provider, merchant);

CREATE UNIQUE INDEX bank_notification_identity ON public.bank_notification_events USING btree (account_id, fingerprint);

CREATE INDEX bank_notification_inbox ON public.bank_notification_events USING btree (user_id, group_id, received_at);

CREATE INDEX idx_accounts_group_id ON public.accounts USING btree (group_id);

CREATE INDEX idx_accounts_type ON public.accounts USING btree (type);

CREATE INDEX idx_accounts_user_ids ON public.accounts USING gin (user_ids);

CREATE INDEX idx_available_shares_asset_type ON public.available_shares USING btree (asset_type);

CREATE INDEX idx_available_shares_is_popular ON public.available_shares USING btree (is_popular) WHERE (is_popular = true);

CREATE INDEX idx_available_shares_region ON public.available_shares USING btree (region);

CREATE INDEX idx_available_shares_region_type ON public.available_shares USING btree (region, asset_type);

CREATE INDEX idx_budget_periods_active ON public.budget_periods USING btree (user_id) WHERE (is_active = true);

CREATE INDEX idx_budget_periods_group_id ON public.budget_periods USING btree (group_id);

CREATE UNIQUE INDEX idx_budget_periods_one_active_per_user ON public.budget_periods USING btree (user_id) WHERE (is_active = true);

CREATE INDEX idx_budget_periods_start_date ON public.budget_periods USING btree (start_date);

CREATE INDEX idx_budget_periods_user_id ON public.budget_periods USING btree (user_id);

CREATE INDEX idx_budget_periods_user_start ON public.budget_periods USING btree (user_id, start_date DESC);

CREATE INDEX idx_budgets_amount ON public.budgets USING btree (amount);

CREATE INDEX idx_budgets_categories ON public.budgets USING gin (categories);

CREATE INDEX idx_budgets_type ON public.budgets USING btree (type);

CREATE INDEX idx_budgets_user_id ON public.budgets USING btree (user_id);

CREATE INDEX idx_categories_group_id ON public.categories USING btree (group_id);

CREATE INDEX idx_categories_key ON public.categories USING btree (key);

CREATE UNIQUE INDEX idx_categories_key_unique ON public.categories USING btree (key);

CREATE INDEX idx_categories_label ON public.categories USING btree (label);

CREATE INDEX idx_group_invitations_email ON public.group_invitations USING btree (email);

CREATE INDEX idx_group_invitations_email_group_status ON public.group_invitations USING btree (email, group_id, status);

CREATE INDEX idx_group_invitations_group_id ON public.group_invitations USING btree (group_id);

CREATE INDEX idx_group_invitations_status ON public.group_invitations USING btree (status);

CREATE INDEX idx_group_invitations_token ON public.group_invitations USING btree (invitation_token);

CREATE INDEX idx_groups_is_active ON public.groups USING btree (is_active);

CREATE INDEX idx_groups_plan ON public.groups USING gin (plan);

CREATE INDEX idx_groups_stripe_customer_id ON public.groups USING btree (stripe_customer_id) WHERE (stripe_customer_id IS NOT NULL);

CREATE INDEX idx_groups_stripe_subscription_id ON public.groups USING btree (stripe_subscription_id) WHERE (stripe_subscription_id IS NOT NULL);

CREATE INDEX idx_groups_subscription_status ON public.groups USING btree (subscription_status);

CREATE INDEX idx_groups_user_ids ON public.groups USING gin (user_ids);

CREATE INDEX idx_investments_symbol ON public.investments USING btree (symbol);

CREATE INDEX idx_investments_user_id ON public.investments USING btree (user_id);

CREATE INDEX idx_market_data_last_updated ON public.market_data_cache USING btree (last_updated);

CREATE INDEX idx_orphan_users_clerk_id ON public.orphan_users USING btree (clerk_id);

CREATE INDEX idx_orphan_users_created_at ON public.orphan_users USING btree (created_at);

CREATE INDEX idx_portfolio_snapshots_user_id ON public.portfolio_value_snapshots USING btree (user_id);

CREATE INDEX idx_recurring_transactions_account_id ON public.recurring_transactions USING btree (account_id);

CREATE INDEX idx_recurring_transactions_frequency ON public.recurring_transactions USING btree (frequency);

CREATE INDEX idx_recurring_transactions_is_active ON public.recurring_transactions USING btree (is_active);

CREATE INDEX idx_recurring_transactions_user_ids ON public.recurring_transactions USING gin (user_ids);

CREATE INDEX idx_transactions_account_date ON public.transactions USING btree (account_id, date DESC);

CREATE INDEX idx_transactions_account_id ON public.transactions USING btree (account_id);

CREATE INDEX idx_transactions_amount ON public.transactions USING btree (amount);

CREATE INDEX idx_transactions_category ON public.transactions USING btree (category);

CREATE INDEX idx_transactions_date ON public.transactions USING btree (date);

CREATE INDEX idx_transactions_description ON public.transactions USING gin (to_tsvector('italian'::regconfig, description));

CREATE INDEX idx_transactions_group_id ON public.transactions USING btree (group_id);

CREATE INDEX idx_transactions_recurring_series_id ON public.transactions USING btree (recurring_series_id);

CREATE INDEX idx_transactions_to_account_id ON public.transactions USING btree (to_account_id);

CREATE INDEX idx_transactions_type ON public.transactions USING btree (type);

CREATE INDEX idx_transactions_user_category ON public.transactions USING btree (user_id, category);

CREATE INDEX idx_transactions_user_date ON public.transactions USING btree (user_id, date DESC);

CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id);

CREATE INDEX idx_transactions_user_type ON public.transactions USING btree (user_id, type);

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences USING btree (user_id);

CREATE INDEX idx_users_clerk_id ON public.users USING btree (clerk_id);

CREATE INDEX idx_users_email ON public.users USING btree (email);

CREATE INDEX idx_users_group_id ON public.users USING btree (group_id);

CREATE INDEX idx_users_role ON public.users USING btree (role);

CREATE UNIQUE INDEX portfolio_value_snapshots_user_date_unique ON public.portfolio_value_snapshots USING btree (user_id, snapshot_date);

CREATE UNIQUE INDEX transactions_account_import_hash_unique ON public.transactions USING btree (account_id, import_hash) WHERE (import_hash IS NOT NULL);

CREATE INDEX transactions_description_trgm_idx ON public.transactions USING gin (description gin_trgm_ops);

CREATE INDEX transactions_group_account_idx ON public.transactions USING btree (group_id, account_id);

CREATE INDEX transactions_group_category_idx ON public.transactions USING btree (group_id, category);

CREATE INDEX transactions_group_date_created_id_idx ON public.transactions USING btree (group_id, date DESC, created_at DESC, id DESC);

CREATE INDEX transactions_group_type_idx ON public.transactions USING btree (group_id, type);

CREATE INDEX transactions_group_user_idx ON public.transactions USING btree (group_id, user_id);

CREATE OR REPLACE FUNCTION public.add_budget_period_to_user(p_user_id uuid, p_start_date date, p_end_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    new_period JSONB;
    new_period_id TEXT;
BEGIN
    -- Generate a unique ID for the budget period
    new_period_id := 'bdp_' || extract(epoch from now())::bigint || floor(random() * 1000)::int;

    -- Create the new budget period
    new_period := jsonb_build_object(
        'id', new_period_id,
        'user_id', p_user_id,
        'start_date', p_start_date,
        'end_date', p_end_date,
        'total_spent', 0,
        'total_saved', 0,
        'category_spending', '{}',
        'is_active', CASE WHEN p_end_date IS NULL THEN true ELSE false END,
        'created_at', now(),
        'updated_at', now()
    );

    -- Deactivate any existing active periods if this is the new active one
    IF p_end_date IS NULL THEN
        UPDATE public.users
        SET budget_periods = (
            SELECT jsonb_agg(
                CASE
                    WHEN (period->>'is_active')::boolean = true
                    THEN jsonb_set(period, '{is_active}', 'false')
                    ELSE period
                END
            )
            FROM jsonb_array_elements(budget_periods) period
        )
        WHERE id = p_user_id;
    END IF;

    -- Add the new budget period
    UPDATE public.users
    SET
        budget_periods = budget_periods || new_period,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN new_period;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_category_to_budget(p_budget_id uuid, p_category text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.budgets
    SET
        categories = categories || jsonb_build_array(p_category),
        updated_at = NOW()
    WHERE id = p_budget_id
      AND NOT (categories ? p_category);

    RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_user_to_account(p_account_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.accounts
    SET
        user_ids = array_append(user_ids, p_user_id),
        updated_at = NOW()
    WHERE id = p_account_id
      AND NOT (p_user_id = ANY(user_ids));

    RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_user_to_group(p_group_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.groups
    SET
        user_ids = array_append(user_ids, p_user_id),
        updated_at = NOW()
    WHERE id = p_group_id
      AND NOT (p_user_id = ANY(user_ids));

    RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.bump_account_balance_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.balance_version := OLD.balance_version + CASE WHEN NEW.balance IS DISTINCT FROM OLD.balance THEN 1 ELSE 0 END;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_account_balance(p_account_id uuid, p_end_date date DEFAULT CURRENT_DATE)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    balance DECIMAL := 0;
BEGIN
    -- Sum income transactions
    SELECT COALESCE(SUM(amount), 0) INTO balance
    FROM public.transactions
    WHERE account_id = p_account_id
      AND type = 'income'
      AND date <= p_end_date;

    -- Subtract expense transactions
    balance := balance - COALESCE((
        SELECT SUM(amount)
        FROM public.transactions
        WHERE account_id = p_account_id
          AND type = 'expense'
          AND date <= p_end_date
    ), 0);

    -- Handle transfers (outgoing)
    balance := balance - COALESCE((
        SELECT SUM(amount)
        FROM public.transactions
        WHERE account_id = p_account_id
          AND type = 'transfer'
          AND date <= p_end_date
    ), 0);

    -- Handle transfers (incoming)
    balance := balance + COALESCE((
        SELECT SUM(amount)
        FROM public.transactions
        WHERE to_account_id = p_account_id
          AND type = 'transfer'
          AND date <= p_end_date
    ), 0);

    RETURN balance;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_next_due_date(p_current_date date, p_frequency character varying, p_day_of_month integer DEFAULT NULL::integer, p_day_of_week integer DEFAULT NULL::integer, p_month_of_year integer DEFAULT NULL::integer)
 RETURNS date
 LANGUAGE plpgsql
AS $function$
DECLARE
    next_date DATE;
BEGIN
    CASE p_frequency
        WHEN 'daily' THEN
            next_date := p_current_date + INTERVAL '1 day';

        WHEN 'weekly' THEN
            IF p_day_of_week IS NOT NULL THEN
                next_date := p_current_date + INTERVAL '1 week';
                -- Adjust to correct day of week if needed
                next_date := next_date + (p_day_of_week - EXTRACT(DOW FROM next_date))::INTEGER;
            ELSE
                next_date := p_current_date + INTERVAL '1 week';
            END IF;

        WHEN 'monthly' THEN
            IF p_day_of_month IS NOT NULL THEN
                next_date := (p_current_date + INTERVAL '1 month')::DATE;
                -- Adjust day of month, handling month-end cases
                BEGIN
                    next_date := DATE_TRUNC('month', next_date) + (p_day_of_month - 1) * INTERVAL '1 day';
                EXCEPTION WHEN OTHERS THEN
                    -- If day doesn't exist in month, use last day of month
                    next_date := (DATE_TRUNC('month', next_date) + INTERVAL '1 month - 1 day')::DATE;
                END;
            ELSE
                next_date := p_current_date + INTERVAL '1 month';
            END IF;

        WHEN 'quarterly' THEN
            next_date := p_current_date + INTERVAL '3 months';

        WHEN 'yearly' THEN
            IF p_month_of_year IS NOT NULL AND p_day_of_month IS NOT NULL THEN
                next_date := DATE_TRUNC('year', p_current_date + INTERVAL '1 year') +
                           (p_month_of_year - 1) * INTERVAL '1 month' +
                           (p_day_of_month - 1) * INTERVAL '1 day';
            ELSE
                next_date := p_current_date + INTERVAL '1 year';
            END IF;

        ELSE
            RAISE EXCEPTION 'Invalid frequency: %', p_frequency;
    END CASE;

    RETURN next_date;
END;
$function$;

CREATE OR REPLACE FUNCTION public.category_reference_keys(p_group_id uuid)
 RETURNS TABLE(category_key text)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
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
    SELECT e.category FROM public.bank_notification_events e WHERE p_group_id IS NULL OR e.group_id = p_group_id
    UNION ALL
    SELECT r.category FROM public.bank_merchant_rules r WHERE p_group_id IS NULL OR r.group_id = p_group_id
  ) refs WHERE key IS NOT NULL AND key <> '';
$function$;

CREATE OR REPLACE FUNCTION public.expire_old_invitations()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.group_invitations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_active_budget_period(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    active_period JSONB;
BEGIN
    SELECT period INTO active_period
    FROM public.users u,
         jsonb_array_elements(u.budget_periods) period
    WHERE u.id = p_user_id
      AND (period->>'is_active')::boolean = true
    LIMIT 1;

    RETURN COALESCE(active_period, '{}'::jsonb);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_all_categories()
 RETURNS TABLE(id uuid, key text, label text, icon text, color text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        c.id, c.key, c.label, c.icon, c.color, c.created_at, c.updated_at
    FROM public.categories c
    ORDER BY c.label;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_available_share_asset_types(p_region text)
 RETURNS TABLE(asset_type text)
 LANGUAGE sql
 STABLE
AS $function$
  select distinct asset_type
  from public.available_shares
  where asset_type is not null
    and (p_region is null or region = p_region)
  order by asset_type;
$function$;

CREATE OR REPLACE FUNCTION public.get_available_share_regions()
 RETURNS TABLE(region text)
 LANGUAGE sql
 STABLE
AS $function$
  select distinct region
  from public.available_shares
  where region is not null
  order by region;
$function$;

CREATE OR REPLACE FUNCTION public.get_budgets_by_category(p_category text)
 RETURNS TABLE(id uuid, description text, amount numeric, type text, icon text, categories jsonb, user_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        b.id, b.description, b.amount, b.type, b.icon, b.categories, b.user_id, b.created_at, b.updated_at
    FROM public.budgets b
    WHERE b.categories ? p_category
    ORDER BY b.description;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_categories_by_theme(p_color_pattern text)
 RETURNS TABLE(id uuid, key text, label text, icon text, color text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        c.id, c.key, c.label, c.icon, c.color, c.created_at, c.updated_at
    FROM public.categories c
    WHERE c.color ILIKE p_color_pattern
    ORDER BY c.label;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_category_by_key(p_key text)
 RETURNS TABLE(id uuid, key text, label text, icon text, color text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        c.id, c.key, c.label, c.icon, c.color, c.created_at, c.updated_at
    FROM public.categories c
    WHERE c.key = p_key;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_due_recurring_transactions(p_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(id uuid, name character varying, description text, amount numeric, type character varying, user_id uuid, account_id uuid, category_id uuid, group_id uuid, to_account_id uuid, next_due_date date, frequency character varying, auto_execute boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        rt.id,
        rt.name,
        rt.description,
        rt.amount,
        rt.type,
        rt.user_id,
        rt.account_id,
        rt.category_id,
        rt.group_id,
        rt.to_account_id,
        rt.next_due_date,
        rt.frequency,
        rt.auto_execute
    FROM public.recurring_transactions rt
    WHERE rt.is_active = true
      AND rt.is_paused = false
      AND rt.next_due_date <= p_date
      AND (rt.end_date IS NULL OR rt.end_date >= p_date)
      AND (rt.pause_until IS NULL OR rt.pause_until < p_date)
    ORDER BY rt.next_due_date ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_group_category_spending(p_group_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(agg), '[]'::json)
  INTO result
  FROM (
    SELECT 
      t.category,
      SUM(
        CASE 
          WHEN t.type = 'income' THEN -t.amount 
          ELSE t.amount 
        END
      ) as spent,
      COUNT(*) as transaction_count
    FROM transactions t
    WHERE t.group_id = p_group_id
      AND t.date >= p_start_date
      AND t.date <= p_end_date
    GROUP BY t.category
    HAVING SUM(CASE WHEN t.type = 'income' THEN -t.amount ELSE t.amount END) > 0
  ) agg;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_group_monthly_spending(p_group_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(agg), '[]'::json)
  INTO result
  FROM (
    SELECT 
      TO_CHAR(t.date, 'YYYY-MM') as month,
      SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
      SUM(CASE WHEN t.type = 'expense' OR t.type = 'transfer' THEN t.amount ELSE 0 END) as expense
    FROM transactions t
    WHERE t.group_id = p_group_id
      AND t.date >= p_start_date
      AND t.date <= p_end_date
    GROUP BY TO_CHAR(t.date, 'YYYY-MM')
    ORDER BY month DESC
  ) agg;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_group_user_category_spending(p_group_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT COALESCE(json_agg(agg), '[]'::json)
  INTO result
  FROM (
    SELECT 
      t.user_id,
      t.category,
      SUM(CASE WHEN t.type = 'expense' OR t.type = 'transfer' THEN t.amount ELSE 0 END) as spent,
      SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
      COUNT(*) as transaction_count
    FROM transactions t
    WHERE t.group_id = p_group_id
      AND t.date >= p_start_date
      AND t.date <= p_end_date
    GROUP BY t.user_id, t.category
  ) agg;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_monthly_spending_by_category(p_user_id uuid, p_year integer, p_month integer)
 RETURNS TABLE(category character varying, total_amount numeric, transaction_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        t.category,
        SUM(t.amount) as total_amount,
        COUNT(*)::BIGINT as transaction_count
    FROM public.transactions t
    WHERE t.user_id = p_user_id
      AND t.type = 'expense'
      AND EXTRACT(YEAR FROM t.date) = p_year
      AND EXTRACT(MONTH FROM t.date) = p_month
    GROUP BY t.category
    ORDER BY total_amount DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_popular_shares(p_limit integer DEFAULT 12)
 RETURNS TABLE(id uuid, symbol text, name text, region text, asset_type text, exchange text, currency text, is_popular boolean)
 LANGUAGE sql
 STABLE
AS $function$
  select id, symbol, name, region, asset_type, exchange, currency, is_popular
  from public.available_shares
  where is_popular is true
  order by name
  limit p_limit;
$function$;

CREATE OR REPLACE FUNCTION public.get_recurring_transactions_by_user(p_user_id uuid)
 RETURNS TABLE(id uuid, name character varying, description text, amount numeric, type character varying, user_id uuid, account_id uuid, category_id uuid, group_id uuid, to_account_id uuid, start_date date, end_date date, next_due_date date, frequency character varying, day_of_month integer, day_of_week integer, month_of_year integer, is_active boolean, is_paused boolean, pause_until date, last_executed_date date, total_executions integer, failed_executions integer, auto_execute boolean, notify_before_days integer, tags text[], notes text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT rt.*
    FROM public.recurring_transactions rt
    WHERE rt.user_id = p_user_id
    ORDER BY rt.next_due_date ASC, rt.name ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_transactions_by_user(p_user_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_category text DEFAULT NULL::text, p_type text DEFAULT NULL::text, p_account_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, description text, amount numeric, type character varying, category character varying, date date, user_id uuid, account_id uuid, to_account_id uuid, group_id uuid, recurring_series_id uuid, frequency character varying, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT t.id, t.description, t.amount, t.type, t.category, t.date,
           t.user_id, t.account_id, t.to_account_id, t.group_id,
           t.recurring_series_id, t.frequency, t.created_at, t.updated_at
    FROM public.transactions t
    WHERE t.user_id = p_user_id
      AND (p_start_date IS NULL OR t.date >= p_start_date)
      AND (p_end_date IS NULL OR t.date <= p_end_date)
      AND (p_category IS NULL OR t.category = p_category)
      AND (p_type IS NULL OR t.type = p_type)
      AND (p_account_id IS NULL OR t.account_id = p_account_id)
    ORDER BY t.date DESC, t.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_accounts(p_user_clerk_id text)
 RETURNS TABLE(id uuid, name text, type text, user_ids uuid[], group_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        a.id, a.name, a.type, a.user_ids, a.group_id, a.created_at, a.updated_at
    FROM public.accounts a
    JOIN public.users u ON u.clerk_id = p_user_clerk_id
    WHERE
        u.id = ANY(a.user_ids)
        OR a.group_id = u.group_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_budget_total(p_user_clerk_id text, p_type text DEFAULT 'monthly'::text)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    total_amount DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(b.amount), 0) INTO total_amount
    FROM public.budgets b
    JOIN public.users u ON u.id = b.user_id
    WHERE u.clerk_id = p_user_clerk_id
      AND b.type = p_type;

    RETURN total_amount;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_budgets(p_user_clerk_id text)
 RETURNS TABLE(id uuid, description text, amount numeric, type text, icon text, categories jsonb, user_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        b.id, b.description, b.amount, b.type, b.icon, b.categories, b.user_id, b.created_at, b.updated_at
    FROM public.budgets b
    JOIN public.users u ON u.id = b.user_id
    WHERE u.clerk_id = p_user_clerk_id
    ORDER BY b.description;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_by_clerk_id(p_clerk_id text)
 RETURNS TABLE(id uuid, clerk_id text, name text, email text, avatar text, theme_color text, budget_start_date integer, group_id uuid, role text, budget_periods jsonb, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        u.id, u.clerk_id, u.name, u.email, u.avatar,
        u.theme_color, u.budget_start_date, u.group_id, u.role,
        u.budget_periods, u.created_at, u.updated_at
    FROM public.users u
    WHERE u.clerk_id = p_clerk_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_by_email(p_email text)
 RETURNS TABLE(id uuid, clerk_id text, name text, email text, avatar text, theme_color text, budget_start_date integer, group_id uuid, role text, budget_periods jsonb, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        u.id, u.clerk_id, u.name, u.email, u.avatar,
        u.theme_color, u.budget_start_date, u.group_id, u.role,
        u.budget_periods, u.created_at, u.updated_at
    FROM public.users u
    WHERE u.email = p_email;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_groups(p_user_clerk_id text)
 RETURNS TABLE(id uuid, name text, description text, user_ids uuid[], plan jsonb, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        g.id, g.name, g.description, g.user_ids, g.plan, g.is_active, g.created_at, g.updated_at
    FROM public.groups g
    JOIN public.users u ON u.clerk_id = p_user_clerk_id
    WHERE u.id = ANY(g.user_ids)
    ORDER BY g.name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_users_in_group(p_user_clerk_id text)
 RETURNS TABLE(id uuid, clerk_id text, name text, email text, avatar text, theme_color text, budget_start_date integer, group_id uuid, role text, budget_periods jsonb, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        u.id, u.clerk_id, u.name, u.email, u.avatar,
        u.theme_color, u.budget_start_date, u.group_id, u.role,
        u.budget_periods, u.created_at, u.updated_at
    FROM public.users u
    WHERE u.group_id = (
        SELECT group_id FROM public.users WHERE clerk_id = p_user_clerk_id
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_category_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  -- The parent group's removal already owns the lifecycle of its cascading data.
  IF pg_trigger_depth() > 1 AND NOT EXISTS (SELECT 1 FROM public.groups WHERE id = OLD.group_id) THEN RETURN OLD; END IF;
  IF EXISTS (SELECT 1 FROM public.category_reference_keys(NULL) WHERE category_key = OLD.key) THEN
    RAISE EXCEPTION 'CATEGORY_IN_USE' USING ERRCODE = '23503';
  END IF;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_category_reference()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  reference_keys text[];
  reference_key text;
  current_row jsonb := to_jsonb(NEW);
  previous_row jsonb := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'budgets' AND (current_row->'categories') IS NOT DISTINCT FROM (previous_row->'categories') THEN RETURN NEW; END IF;
    IF TG_TABLE_NAME = 'budget_periods' AND (current_row->'budgets_snapshot') IS NOT DISTINCT FROM (previous_row->'budgets_snapshot') AND (current_row->'category_spending') IS NOT DISTINCT FROM (previous_row->'category_spending') THEN RETURN NEW; END IF;
    IF TG_TABLE_NAME NOT IN ('budgets', 'budget_periods', 'bank_connections') AND (current_row->>'category') IS NOT DISTINCT FROM (previous_row->>'category') THEN RETURN NEW; END IF;
  END IF;
  IF TG_TABLE_NAME = 'budgets' THEN
    SELECT array_agg(k) INTO reference_keys FROM jsonb_array_elements_text((current_row->'categories')) k;
  ELSIF TG_TABLE_NAME = 'budget_periods' THEN
    SELECT array_agg(k) INTO reference_keys FROM (
      SELECT jsonb_object_keys(coalesce(nullif(current_row->'category_spending', 'null'::jsonb), '{}'::jsonb)) k
      UNION SELECT jsonb_array_elements_text(coalesce(b->'categories', '[]'::jsonb)) FROM jsonb_array_elements(coalesce(nullif(current_row->'budgets_snapshot', 'null'::jsonb), '[]'::jsonb)) b
    ) keys;
  ELSE
    reference_keys := ARRAY[(current_row->>'category')];
  END IF;
  -- Same ordering for multiple keys. KEY SHARE conflicts with category deletion.
  FOR reference_key IN SELECT DISTINCT k FROM unnest(reference_keys) k WHERE k IS NOT NULL AND k <> '' ORDER BY k LOOP
    PERFORM 1 FROM public.categories WHERE key = reference_key FOR KEY SHARE;
    IF NOT FOUND THEN
      -- Archiving existing references is not the creation of a new reference.
      -- Keep legacy IDs/deleted keys verbatim, but only from this owner's
      -- persisted budget or from this very period's previous snapshot.
      IF TG_TABLE_NAME = 'budget_periods' THEN
        IF TG_OP = 'UPDATE'
          AND (current_row->>'user_id') IS NOT DISTINCT FROM (previous_row->>'user_id')
          AND (current_row->>'group_id') IS NOT DISTINCT FROM (previous_row->>'group_id')
          AND (
            coalesce(previous_row->'category_spending', '{}'::jsonb) ? reference_key
            OR EXISTS (
              SELECT 1 FROM jsonb_array_elements(coalesce(nullif(previous_row->'budgets_snapshot', 'null'::jsonb), '[]'::jsonb)) item
              WHERE (item->'categories') ? reference_key
            )
          ) THEN CONTINUE;
        END IF;
        IF EXISTS (
          SELECT 1
          FROM jsonb_array_elements(coalesce(nullif(current_row->'budgets_snapshot', 'null'::jsonb), '[]'::jsonb)) item
          JOIN public.budgets live ON live.id::text = item->>'id'
          WHERE live.user_id = (current_row->>'user_id')::uuid
            AND live.group_id = coalesce(
              (current_row->>'group_id')::uuid,
              (SELECT u.group_id FROM public.users u WHERE u.id = (current_row->>'user_id')::uuid)
            )
            AND live.categories ? reference_key
            AND (item->'categories') ? reference_key
        ) THEN CONTINUE;
        END IF;
      END IF;
      RAISE EXCEPTION 'Category reference is unavailable' USING ERRCODE = '23503';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.populate_transaction_relations()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Populate user_id from account_id if not provided
    IF NEW.user_id IS NULL AND NEW.account_id IS NOT NULL THEN
        SELECT unnest(user_ids) INTO NEW.user_id
        FROM public.accounts
        WHERE id = NEW.account_id
        LIMIT 1;
    END IF;

    -- Populate group_id from account_id if not provided
    IF NEW.group_id IS NULL AND NEW.account_id IS NOT NULL THEN
        SELECT group_id INTO NEW.group_id
        FROM public.accounts
        WHERE id = NEW.account_id;
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.remove_category_from_budget(p_budget_id uuid, p_category text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.budgets
    SET
        categories = categories - p_category,
        updated_at = NOW()
    WHERE id = p_budget_id
      AND categories ? p_category;

    RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.remove_user_from_account(p_account_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.accounts
    SET
        user_ids = array_remove(user_ids, p_user_id),
        updated_at = NOW()
    WHERE id = p_account_id
      AND p_user_id = ANY(user_ids);

    RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.remove_user_from_group(p_group_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.groups
    SET
        user_ids = array_remove(user_ids, p_user_id),
        updated_at = NOW()
    WHERE id = p_group_id
      AND p_user_id = ANY(user_ids);

    RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_account_balance(p_account_id uuid, p_delta numeric)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
  new_balance NUMERIC;
BEGIN
  UPDATE accounts
  SET balance = COALESCE(balance, 0) + p_delta,
      updated_at = NOW()
  WHERE id = p_account_id
  RETURNING balance INTO new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found: %', p_account_id;
  END IF;

  RETURN new_balance;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_accounts_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_available_shares_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_budgets_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_categories_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_group_invitations_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_group_plan(p_group_id uuid, p_plan_type text, p_plan_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.groups
    SET
        plan = jsonb_build_object('type', p_plan_type, 'name', p_plan_name),
        updated_at = NOW()
    WHERE id = p_group_id;

    RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_groups_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_recurring_transaction_execution(p_recurring_transaction_id uuid, p_success boolean DEFAULT true)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    rt_record RECORD;
    next_date DATE;
BEGIN
    -- Get current recurring transaction data
    SELECT * INTO rt_record
    FROM public.recurring_transactions
    WHERE id = p_recurring_transaction_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recurring transaction not found: %', p_recurring_transaction_id;
    END IF;

    -- Calculate next due date
    next_date := calculate_next_due_date(
        rt_record.next_due_date,
        rt_record.frequency,
        rt_record.day_of_month,
        rt_record.day_of_week,
        rt_record.month_of_year
    );

    -- Update the recurring transaction
    UPDATE public.recurring_transactions
    SET
        last_executed_date = CURRENT_DATE,
        next_due_date = next_date,
        total_executions = total_executions + 1,
        failed_executions = CASE
            WHEN p_success THEN failed_executions
            ELSE failed_executions + 1
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_recurring_transaction_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_recurring_transactions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_transactions_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_clerk_id_by_email(p_email text, p_clerk_id text)
 RETURNS TABLE(id uuid, clerk_id text, name text, email text, avatar text, theme_color text, budget_start_date integer, group_id uuid, role text, budget_periods jsonb, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    UPDATE public.users
    SET
        clerk_id = p_clerk_id,
        updated_at = NOW()
    WHERE email = p_email
    RETURNING
        users.id, users.clerk_id, users.name, users.email, users.avatar,
        users.theme_color, users.budget_start_date, users.group_id, users.role,
        users.budget_periods, users.created_at, users.updated_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_user_preferences_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_users_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_user_by_clerk_id(p_clerk_id text, p_name text, p_email text, p_avatar text DEFAULT ''::text)
 RETURNS TABLE(id uuid, clerk_id text, name text, email text, avatar text, theme_color text, budget_start_date integer, group_id uuid, role text, budget_periods jsonb, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    INSERT INTO public.users (clerk_id, name, email, avatar)
    VALUES (p_clerk_id, p_name, p_email, p_avatar)
    ON CONFLICT (clerk_id)
    DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        avatar = EXCLUDED.avatar,
        updated_at = NOW()
    RETURNING
        users.id, users.clerk_id, users.name, users.email, users.avatar,
        users.theme_color, users.budget_start_date, users.group_id, users.role,
        users.budget_periods, users.created_at, users.updated_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_role_permission(p_user_clerk_id text, p_required_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.users
    WHERE clerk_id = p_user_clerk_id;

    -- Return false if user not found
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check role hierarchy: superadmin > admin > member
    CASE p_required_role
        WHEN 'member' THEN
            RETURN user_role IN ('member', 'admin', 'superadmin');
        WHEN 'admin' THEN
            RETURN user_role IN ('admin', 'superadmin');
        WHEN 'superadmin' THEN
            RETURN user_role = 'superadmin';
        ELSE
            RETURN FALSE;
    END CASE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_transaction_accounts()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Transfer transactions must have to_account_id
    IF NEW.type = 'transfer' AND NEW.to_account_id IS NULL THEN
        RAISE EXCEPTION 'Transfer transactions must have a destination account (to_account_id)';
    END IF;

    -- Transfer transactions cannot have same source and destination
    IF NEW.type = 'transfer' AND NEW.account_id = NEW.to_account_id THEN
        RAISE EXCEPTION 'Transfer transactions cannot have the same source and destination account';
    END IF;

    -- Amounts should be positive (handled by business logic, but constraint for safety)
    IF NEW.amount <= 0 THEN
        RAISE EXCEPTION 'Transaction amount must be positive';
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_transaction_references()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Check if source_transaction_id exists
    IF NOT EXISTS (SELECT 1 FROM transactions WHERE id::text = NEW.source_transaction_id) THEN
        RAISE EXCEPTION 'Source transaction with id % does not exist', NEW.source_transaction_id;
    END IF;
    
    -- Check if target_transaction_id exists
    IF NOT EXISTS (SELECT 1 FROM transactions WHERE id::text = NEW.target_transaction_id) THEN
        RAISE EXCEPTION 'Target transaction with id % does not exist', NEW.target_transaction_id;
    END IF;
    
    -- Check if source and target are different
    IF NEW.source_transaction_id = NEW.target_transaction_id THEN
        RAISE EXCEPTION 'Source and target transaction cannot be the same';
    END IF;
    
    -- Check if created_by exists (if provided)
    IF NEW.created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id::text = NEW.created_by) THEN
        RAISE EXCEPTION 'User with id % does not exist', NEW.created_by;
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_transaction_population()
 RETURNS TABLE(total_transactions bigint, transactions_with_user_id bigint, transactions_with_group_id bigint, transactions_without_user_id bigint, transactions_without_group_id bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_transactions,
        COUNT(user_id)::BIGINT as transactions_with_user_id,
        COUNT(group_id)::BIGINT as transactions_with_group_id,
        COUNT(CASE WHEN user_id IS NULL THEN 1 END)::BIGINT as transactions_without_user_id,
        COUNT(CASE WHEN group_id IS NULL THEN 1 END)::BIGINT as transactions_without_group_id
    FROM public.transactions;
END;
$function$;

CREATE VIEW public."budget_analytics" WITH (security_invoker=on) AS SELECT u.name AS user_name,
    u.email AS user_email,
    b.description,
    b.amount,
    b.type,
    jsonb_array_length(b.categories) AS category_count,
    b.created_at,
    b.updated_at
   FROM (budgets b
     JOIN users u ON ((u.id = b.user_id)));

CREATE VIEW public."category_usage_stats" WITH (security_invoker=on) AS WITH budget_categories AS (
         SELECT jsonb_array_elements_text(budgets.categories) AS category_key
           FROM budgets
        ), transaction_categories AS (
         SELECT transactions.category AS category_key
           FROM transactions
          WHERE (transactions.category IS NOT NULL)
        )
 SELECT c.id,
    c.key,
    c.label,
    c.icon,
    c.color,
    (COALESCE(budget_usage.usage_count, (0)::bigint) + COALESCE(transaction_usage.usage_count, (0)::bigint)) AS total_usage,
    COALESCE(budget_usage.usage_count, (0)::bigint) AS budget_usage,
    COALESCE(transaction_usage.usage_count, (0)::bigint) AS transaction_usage
   FROM ((categories c
     LEFT JOIN ( SELECT budget_categories.category_key,
            count(*) AS usage_count
           FROM budget_categories
          GROUP BY budget_categories.category_key) budget_usage ON ((c.key = budget_usage.category_key)))
     LEFT JOIN ( SELECT transaction_categories.category_key,
            count(*) AS usage_count
           FROM transaction_categories
          GROUP BY transaction_categories.category_key) transaction_usage ON ((c.key = (transaction_usage.category_key)::text)));

CREATE VIEW public."users_with_stats" WITH (security_invoker=on) AS SELECT id,
    clerk_id,
    name,
    email,
    avatar,
    theme_color,
    budget_start_date,
    group_id,
    role,
    created_at,
    updated_at,
    ( SELECT (count(*))::integer AS count
           FROM budget_periods bp
          WHERE (bp.user_id = u.id)) AS total_budget_periods,
    ( SELECT (count(*))::integer AS count
           FROM budget_periods bp
          WHERE ((bp.user_id = u.id) AND (bp.is_active = true))) AS active_budget_periods
   FROM users u;

CREATE TRIGGER accounts_balance_version BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION bump_account_balance_version();

CREATE TRIGGER trigger_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION update_accounts_updated_at();

CREATE TRIGGER trigger_available_shares_updated_at BEFORE UPDATE ON public.available_shares FOR EACH ROW EXECUTE FUNCTION update_available_shares_updated_at();

CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.bank_merchant_rules FOR EACH ROW EXECUTE FUNCTION guard_category_reference();

CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.bank_notification_events FOR EACH ROW EXECUTE FUNCTION guard_category_reference();

CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.budget_periods FOR EACH ROW EXECUTE FUNCTION guard_category_reference();

CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION guard_category_reference();

CREATE TRIGGER trigger_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION update_budgets_updated_at();

CREATE TRIGGER category_delete_guard BEFORE DELETE ON public.categories FOR EACH ROW EXECUTE FUNCTION guard_category_delete();

CREATE TRIGGER trigger_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_categories_updated_at();

CREATE TRIGGER trigger_update_group_invitations_updated_at BEFORE UPDATE ON public.group_invitations FOR EACH ROW EXECUTE FUNCTION update_group_invitations_updated_at();

CREATE TRIGGER trigger_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION update_groups_updated_at();

CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.recurring_transactions FOR EACH ROW EXECUTE FUNCTION guard_category_reference();

CREATE TRIGGER trigger_update_recurring_transactions_updated_at BEFORE UPDATE ON public.recurring_transactions FOR EACH ROW EXECUTE FUNCTION update_recurring_transactions_updated_at();

CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION guard_category_reference();

CREATE TRIGGER trigger_populate_transaction_relations BEFORE INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION populate_transaction_relations();

CREATE TRIGGER trigger_update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_transactions_updated_at();

CREATE TRIGGER trigger_validate_transaction_accounts BEFORE INSERT OR UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION validate_transaction_accounts();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_users_updated_at();

ALTER TABLE public."accounts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."available_shares" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."bank_connections" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."bank_merchant_rules" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."bank_notification_events" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."budget_periods" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."budgets" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."categories" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."group_invitations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."groups" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."investments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."market_data_cache" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."orphan_users" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."portfolio_value_snapshots" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."recurring_transactions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."transactions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."user_preferences" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create accounts in their group" ON public."accounts" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((group_id IN ( SELECT users.group_id
   FROM users
  WHERE (users.clerk_id = (auth.jwt() ->> 'sub'::text)))));

CREATE POLICY "Users can delete their accounts" ON public."accounts" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.clerk_id = (auth.jwt() ->> 'sub'::text)) AND (u.id = ANY (accounts.user_ids))))));

CREATE POLICY "Users can update their accounts" ON public."accounts" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.clerk_id = (auth.jwt() ->> 'sub'::text)) AND (u.id = ANY (accounts.user_ids))))));

CREATE POLICY "Users can view their accounts" ON public."accounts" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.clerk_id = (auth.jwt() ->> 'sub'::text)) AND ((u.id = ANY (accounts.user_ids)) OR (u.group_id = accounts.group_id))))));

CREATE POLICY "Users can create their own budgets" ON public."budgets" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.clerk_id = (auth.jwt() ->> 'sub'::text)))));

CREATE POLICY "Users can delete their own budgets" ON public."budgets" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.clerk_id = (auth.jwt() ->> 'sub'::text)))));

CREATE POLICY "Users can update their own budgets" ON public."budgets" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.clerk_id = (auth.jwt() ->> 'sub'::text)))));

CREATE POLICY "Users can view their own budgets" ON public."budgets" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((user_id IN ( SELECT users.id
   FROM users
  WHERE (users.clerk_id = (auth.jwt() ->> 'sub'::text)))));

CREATE POLICY "Categories are readable by all authenticated users" ON public."categories" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Only admins can modify categories" ON public."categories" AS PERMISSIVE FOR ALL TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.clerk_id = (auth.jwt() ->> 'sub'::text)) AND (users.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))))));

CREATE POLICY "Group admins can create invitations" ON public."group_invitations" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((invited_by_user_id IN ( SELECT users.id
   FROM users
  WHERE ((users.clerk_id = (auth.uid())::text) AND (users.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))))));

CREATE POLICY "Group admins can delete invitations" ON public."group_invitations" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((group_id IN ( SELECT users.group_id
   FROM users
  WHERE ((users.clerk_id = (auth.uid())::text) AND (users.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))))));

CREATE POLICY "Group admins can update invitations" ON public."group_invitations" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((group_id IN ( SELECT users.group_id
   FROM users
  WHERE ((users.clerk_id = (auth.uid())::text) AND (users.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))))));

CREATE POLICY "Group members can view their group invitations" ON public."group_invitations" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((group_id IN ( SELECT users.group_id
   FROM users
  WHERE (users.clerk_id = (auth.uid())::text))));

CREATE POLICY "Admins can update their groups" ON public."groups" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.clerk_id = (auth.jwt() ->> 'sub'::text)) AND (u.id = ANY (groups.user_ids)) AND (u.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))))));

CREATE POLICY "Superadmins can create groups" ON public."groups" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.clerk_id = (auth.jwt() ->> 'sub'::text)) AND (u.role = 'superadmin'::text)))));

CREATE POLICY "Superadmins can delete groups" ON public."groups" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.clerk_id = (auth.jwt() ->> 'sub'::text)) AND (u.role = 'superadmin'::text)))));

CREATE POLICY "Users can view their groups" ON public."groups" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.clerk_id = (auth.jwt() ->> 'sub'::text)) AND (u.id = ANY (groups.user_ids))))));

CREATE POLICY "Users can delete their own investments" ON public."investments" AS PERMISSIVE FOR DELETE TO PUBLIC USING (((auth.uid())::text = ( SELECT users.clerk_id
   FROM users
  WHERE (users.id = investments.user_id))));

CREATE POLICY "Users can insert their own investments" ON public."investments" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((auth.uid())::text = ( SELECT users.clerk_id
   FROM users
  WHERE (users.id = investments.user_id))));

CREATE POLICY "Users can update their own investments" ON public."investments" AS PERMISSIVE FOR UPDATE TO PUBLIC USING (((auth.uid())::text = ( SELECT users.clerk_id
   FROM users
  WHERE (users.id = investments.user_id))));

CREATE POLICY "Users can view their own investments" ON public."investments" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((auth.uid())::text = ( SELECT users.clerk_id
   FROM users
  WHERE (users.id = investments.user_id))));

CREATE POLICY "Users can insert their own portfolio snapshots" ON public."portfolio_value_snapshots" AS PERMISSIVE FOR INSERT TO PUBLIC;

CREATE POLICY "Users can update their own portfolio snapshots" ON public."portfolio_value_snapshots" AS PERMISSIVE FOR UPDATE TO PUBLIC;

CREATE POLICY "Users can view their own portfolio snapshots" ON public."portfolio_value_snapshots" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((auth.uid())::text = ( SELECT users.clerk_id
   FROM users
  WHERE (users.id = portfolio_value_snapshots.user_id))));

CREATE POLICY "Users can create recurring transactions for themselves" ON public."recurring_transactions" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((auth.uid())::text = ANY (user_ids)));

CREATE POLICY "Users can delete their associated recurring transactions" ON public."recurring_transactions" AS PERMISSIVE FOR DELETE TO PUBLIC USING (((auth.uid())::text = ANY (user_ids)));

CREATE POLICY "Users can update their associated recurring transactions" ON public."recurring_transactions" AS PERMISSIVE FOR UPDATE TO PUBLIC USING (((auth.uid())::text = ANY (user_ids))) WITH CHECK (((auth.uid())::text = ANY (user_ids)));

CREATE POLICY "Users can view their associated recurring transactions" ON public."recurring_transactions" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((auth.uid())::text = ANY (user_ids)));

CREATE POLICY "Users can create their own transactions" ON public."transactions" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Users can delete their own transactions" ON public."transactions" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((user_id = auth.uid()));

CREATE POLICY "Users can update their own transactions" ON public."transactions" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((user_id = auth.uid()));

CREATE POLICY "Users can view their own transactions and group transactions" ON public."transactions" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((user_id = auth.uid()) OR (group_id IN ( SELECT g.id
   FROM groups g
  WHERE (auth.uid() = ANY (g.user_ids))))));

CREATE POLICY "Users can insert their own preferences" ON public."user_preferences" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK (((auth.uid())::text IN ( SELECT users.clerk_id
   FROM users
  WHERE (users.id = user_preferences.user_id))));

CREATE POLICY "Users can update their own preferences" ON public."user_preferences" AS PERMISSIVE FOR UPDATE TO PUBLIC USING (((auth.uid())::text IN ( SELECT users.clerk_id
   FROM users
  WHERE (users.id = user_preferences.user_id))));

CREATE POLICY "Users can view their own preferences" ON public."user_preferences" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((auth.uid())::text IN ( SELECT users.clerk_id
   FROM users
  WHERE (users.id = user_preferences.user_id))));

CREATE POLICY "Superadmins can delete users" ON public."users" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((EXISTS ( SELECT 1
   FROM users users_1
  WHERE ((users_1.clerk_id = (auth.jwt() ->> 'sub'::text)) AND (users_1.role = 'superadmin'::text)))));

CREATE POLICY "Superadmins can insert users" ON public."users" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((EXISTS ( SELECT 1
   FROM users users_1
  WHERE ((users_1.clerk_id = (auth.jwt() ->> 'sub'::text)) AND (users_1.role = 'superadmin'::text)))));

CREATE POLICY "Users can update their own record" ON public."users" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((clerk_id = (auth.jwt() ->> 'sub'::text)));

CREATE POLICY "Users can view users in their group" ON public."users" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((group_id IN ( SELECT users_1.group_id
   FROM users users_1
  WHERE (users_1.clerk_id = (auth.jwt() ->> 'sub'::text)))));

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

GRANT DELETE ON public."accounts" TO "pool_user";

GRANT INSERT ON public."accounts" TO "pool_user";

GRANT REFERENCES ON public."accounts" TO "pool_user";

GRANT SELECT ON public."accounts" TO "pool_user";

GRANT TRIGGER ON public."accounts" TO "pool_user";

GRANT TRUNCATE ON public."accounts" TO "pool_user";

GRANT UPDATE ON public."accounts" TO "pool_user";

GRANT DELETE ON public."accounts" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."accounts" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."accounts" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."accounts" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."accounts" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."accounts" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."accounts" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."accounts" TO "service_role";

GRANT INSERT ON public."accounts" TO "service_role";

GRANT REFERENCES ON public."accounts" TO "service_role";

GRANT SELECT ON public."accounts" TO "service_role";

GRANT TRIGGER ON public."accounts" TO "service_role";

GRANT TRUNCATE ON public."accounts" TO "service_role";

GRANT UPDATE ON public."accounts" TO "service_role";

GRANT DELETE ON public."available_shares" TO "pool_user";

GRANT INSERT ON public."available_shares" TO "pool_user";

GRANT REFERENCES ON public."available_shares" TO "pool_user";

GRANT SELECT ON public."available_shares" TO "pool_user";

GRANT TRIGGER ON public."available_shares" TO "pool_user";

GRANT TRUNCATE ON public."available_shares" TO "pool_user";

GRANT UPDATE ON public."available_shares" TO "pool_user";

GRANT DELETE ON public."available_shares" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."available_shares" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."available_shares" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."available_shares" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."available_shares" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."available_shares" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."available_shares" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."available_shares" TO "service_role";

GRANT INSERT ON public."available_shares" TO "service_role";

GRANT REFERENCES ON public."available_shares" TO "service_role";

GRANT SELECT ON public."available_shares" TO "service_role";

GRANT TRIGGER ON public."available_shares" TO "service_role";

GRANT TRUNCATE ON public."available_shares" TO "service_role";

GRANT UPDATE ON public."available_shares" TO "service_role";

GRANT DELETE ON public."bank_connections" TO "pool_user";

GRANT INSERT ON public."bank_connections" TO "pool_user";

GRANT REFERENCES ON public."bank_connections" TO "pool_user";

GRANT SELECT ON public."bank_connections" TO "pool_user";

GRANT TRIGGER ON public."bank_connections" TO "pool_user";

GRANT TRUNCATE ON public."bank_connections" TO "pool_user";

GRANT UPDATE ON public."bank_connections" TO "pool_user";

GRANT DELETE ON public."bank_connections" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."bank_connections" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."bank_connections" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."bank_connections" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."bank_connections" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."bank_connections" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."bank_connections" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."bank_connections" TO "service_role";

GRANT INSERT ON public."bank_connections" TO "service_role";

GRANT REFERENCES ON public."bank_connections" TO "service_role";

GRANT SELECT ON public."bank_connections" TO "service_role";

GRANT TRIGGER ON public."bank_connections" TO "service_role";

GRANT TRUNCATE ON public."bank_connections" TO "service_role";

GRANT UPDATE ON public."bank_connections" TO "service_role";

GRANT DELETE ON public."bank_merchant_rules" TO "pool_user";

GRANT INSERT ON public."bank_merchant_rules" TO "pool_user";

GRANT REFERENCES ON public."bank_merchant_rules" TO "pool_user";

GRANT SELECT ON public."bank_merchant_rules" TO "pool_user";

GRANT TRIGGER ON public."bank_merchant_rules" TO "pool_user";

GRANT TRUNCATE ON public."bank_merchant_rules" TO "pool_user";

GRANT UPDATE ON public."bank_merchant_rules" TO "pool_user";

GRANT DELETE ON public."bank_merchant_rules" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."bank_merchant_rules" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."bank_merchant_rules" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."bank_merchant_rules" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."bank_merchant_rules" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."bank_merchant_rules" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."bank_merchant_rules" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."bank_merchant_rules" TO "service_role";

GRANT INSERT ON public."bank_merchant_rules" TO "service_role";

GRANT REFERENCES ON public."bank_merchant_rules" TO "service_role";

GRANT SELECT ON public."bank_merchant_rules" TO "service_role";

GRANT TRIGGER ON public."bank_merchant_rules" TO "service_role";

GRANT TRUNCATE ON public."bank_merchant_rules" TO "service_role";

GRANT UPDATE ON public."bank_merchant_rules" TO "service_role";

GRANT DELETE ON public."bank_notification_events" TO "pool_user";

GRANT INSERT ON public."bank_notification_events" TO "pool_user";

GRANT REFERENCES ON public."bank_notification_events" TO "pool_user";

GRANT SELECT ON public."bank_notification_events" TO "pool_user";

GRANT TRIGGER ON public."bank_notification_events" TO "pool_user";

GRANT TRUNCATE ON public."bank_notification_events" TO "pool_user";

GRANT UPDATE ON public."bank_notification_events" TO "pool_user";

GRANT DELETE ON public."bank_notification_events" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."bank_notification_events" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."bank_notification_events" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."bank_notification_events" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."bank_notification_events" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."bank_notification_events" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."bank_notification_events" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."bank_notification_events" TO "service_role";

GRANT INSERT ON public."bank_notification_events" TO "service_role";

GRANT REFERENCES ON public."bank_notification_events" TO "service_role";

GRANT SELECT ON public."bank_notification_events" TO "service_role";

GRANT TRIGGER ON public."bank_notification_events" TO "service_role";

GRANT TRUNCATE ON public."bank_notification_events" TO "service_role";

GRANT UPDATE ON public."bank_notification_events" TO "service_role";

GRANT DELETE ON public."budget_analytics" TO "pool_user";

GRANT INSERT ON public."budget_analytics" TO "pool_user";

GRANT REFERENCES ON public."budget_analytics" TO "pool_user";

GRANT SELECT ON public."budget_analytics" TO "pool_user";

GRANT TRIGGER ON public."budget_analytics" TO "pool_user";

GRANT TRUNCATE ON public."budget_analytics" TO "pool_user";

GRANT UPDATE ON public."budget_analytics" TO "pool_user";

GRANT DELETE ON public."budget_analytics" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."budget_analytics" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."budget_analytics" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."budget_analytics" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."budget_analytics" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."budget_analytics" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."budget_analytics" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."budget_analytics" TO "service_role";

GRANT INSERT ON public."budget_analytics" TO "service_role";

GRANT REFERENCES ON public."budget_analytics" TO "service_role";

GRANT SELECT ON public."budget_analytics" TO "service_role";

GRANT TRIGGER ON public."budget_analytics" TO "service_role";

GRANT TRUNCATE ON public."budget_analytics" TO "service_role";

GRANT UPDATE ON public."budget_analytics" TO "service_role";

GRANT DELETE ON public."budget_periods" TO "pool_user";

GRANT INSERT ON public."budget_periods" TO "pool_user";

GRANT REFERENCES ON public."budget_periods" TO "pool_user";

GRANT SELECT ON public."budget_periods" TO "pool_user";

GRANT TRIGGER ON public."budget_periods" TO "pool_user";

GRANT TRUNCATE ON public."budget_periods" TO "pool_user";

GRANT UPDATE ON public."budget_periods" TO "pool_user";

GRANT DELETE ON public."budget_periods" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."budget_periods" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."budget_periods" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."budget_periods" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."budget_periods" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."budget_periods" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."budget_periods" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."budget_periods" TO "service_role";

GRANT INSERT ON public."budget_periods" TO "service_role";

GRANT REFERENCES ON public."budget_periods" TO "service_role";

GRANT SELECT ON public."budget_periods" TO "service_role";

GRANT TRIGGER ON public."budget_periods" TO "service_role";

GRANT TRUNCATE ON public."budget_periods" TO "service_role";

GRANT UPDATE ON public."budget_periods" TO "service_role";

GRANT DELETE ON public."budgets" TO "pool_user";

GRANT INSERT ON public."budgets" TO "pool_user";

GRANT REFERENCES ON public."budgets" TO "pool_user";

GRANT SELECT ON public."budgets" TO "pool_user";

GRANT TRIGGER ON public."budgets" TO "pool_user";

GRANT TRUNCATE ON public."budgets" TO "pool_user";

GRANT UPDATE ON public."budgets" TO "pool_user";

GRANT DELETE ON public."budgets" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."budgets" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."budgets" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."budgets" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."budgets" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."budgets" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."budgets" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."budgets" TO "service_role";

GRANT INSERT ON public."budgets" TO "service_role";

GRANT REFERENCES ON public."budgets" TO "service_role";

GRANT SELECT ON public."budgets" TO "service_role";

GRANT TRIGGER ON public."budgets" TO "service_role";

GRANT TRUNCATE ON public."budgets" TO "service_role";

GRANT UPDATE ON public."budgets" TO "service_role";

GRANT DELETE ON public."categories" TO "pool_user";

GRANT INSERT ON public."categories" TO "pool_user";

GRANT REFERENCES ON public."categories" TO "pool_user";

GRANT SELECT ON public."categories" TO "pool_user";

GRANT TRIGGER ON public."categories" TO "pool_user";

GRANT TRUNCATE ON public."categories" TO "pool_user";

GRANT UPDATE ON public."categories" TO "pool_user";

GRANT DELETE ON public."categories" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."categories" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."categories" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."categories" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."categories" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."categories" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."categories" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."categories" TO "service_role";

GRANT INSERT ON public."categories" TO "service_role";

GRANT REFERENCES ON public."categories" TO "service_role";

GRANT SELECT ON public."categories" TO "service_role";

GRANT TRIGGER ON public."categories" TO "service_role";

GRANT TRUNCATE ON public."categories" TO "service_role";

GRANT UPDATE ON public."categories" TO "service_role";

GRANT DELETE ON public."category_usage_stats" TO "pool_user";

GRANT INSERT ON public."category_usage_stats" TO "pool_user";

GRANT REFERENCES ON public."category_usage_stats" TO "pool_user";

GRANT SELECT ON public."category_usage_stats" TO "pool_user";

GRANT TRIGGER ON public."category_usage_stats" TO "pool_user";

GRANT TRUNCATE ON public."category_usage_stats" TO "pool_user";

GRANT UPDATE ON public."category_usage_stats" TO "pool_user";

GRANT DELETE ON public."category_usage_stats" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."category_usage_stats" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."category_usage_stats" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."category_usage_stats" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."category_usage_stats" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."category_usage_stats" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."category_usage_stats" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."category_usage_stats" TO "service_role";

GRANT INSERT ON public."category_usage_stats" TO "service_role";

GRANT REFERENCES ON public."category_usage_stats" TO "service_role";

GRANT SELECT ON public."category_usage_stats" TO "service_role";

GRANT TRIGGER ON public."category_usage_stats" TO "service_role";

GRANT TRUNCATE ON public."category_usage_stats" TO "service_role";

GRANT UPDATE ON public."category_usage_stats" TO "service_role";

GRANT DELETE ON public."group_invitations" TO "pool_user";

GRANT INSERT ON public."group_invitations" TO "pool_user";

GRANT REFERENCES ON public."group_invitations" TO "pool_user";

GRANT SELECT ON public."group_invitations" TO "pool_user";

GRANT TRIGGER ON public."group_invitations" TO "pool_user";

GRANT TRUNCATE ON public."group_invitations" TO "pool_user";

GRANT UPDATE ON public."group_invitations" TO "pool_user";

GRANT DELETE ON public."group_invitations" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."group_invitations" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."group_invitations" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."group_invitations" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."group_invitations" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."group_invitations" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."group_invitations" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."group_invitations" TO "service_role";

GRANT INSERT ON public."group_invitations" TO "service_role";

GRANT REFERENCES ON public."group_invitations" TO "service_role";

GRANT SELECT ON public."group_invitations" TO "service_role";

GRANT TRIGGER ON public."group_invitations" TO "service_role";

GRANT TRUNCATE ON public."group_invitations" TO "service_role";

GRANT UPDATE ON public."group_invitations" TO "service_role";

GRANT DELETE ON public."groups" TO "pool_user";

GRANT INSERT ON public."groups" TO "pool_user";

GRANT REFERENCES ON public."groups" TO "pool_user";

GRANT SELECT ON public."groups" TO "pool_user";

GRANT TRIGGER ON public."groups" TO "pool_user";

GRANT TRUNCATE ON public."groups" TO "pool_user";

GRANT UPDATE ON public."groups" TO "pool_user";

GRANT DELETE ON public."groups" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."groups" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."groups" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."groups" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."groups" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."groups" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."groups" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."groups" TO "service_role";

GRANT INSERT ON public."groups" TO "service_role";

GRANT REFERENCES ON public."groups" TO "service_role";

GRANT SELECT ON public."groups" TO "service_role";

GRANT TRIGGER ON public."groups" TO "service_role";

GRANT TRUNCATE ON public."groups" TO "service_role";

GRANT UPDATE ON public."groups" TO "service_role";

GRANT DELETE ON public."investments" TO "pool_user";

GRANT INSERT ON public."investments" TO "pool_user";

GRANT REFERENCES ON public."investments" TO "pool_user";

GRANT SELECT ON public."investments" TO "pool_user";

GRANT TRIGGER ON public."investments" TO "pool_user";

GRANT TRUNCATE ON public."investments" TO "pool_user";

GRANT UPDATE ON public."investments" TO "pool_user";

GRANT DELETE ON public."investments" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."investments" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."investments" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."investments" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."investments" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."investments" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."investments" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."investments" TO "service_role";

GRANT INSERT ON public."investments" TO "service_role";

GRANT REFERENCES ON public."investments" TO "service_role";

GRANT SELECT ON public."investments" TO "service_role";

GRANT TRIGGER ON public."investments" TO "service_role";

GRANT TRUNCATE ON public."investments" TO "service_role";

GRANT UPDATE ON public."investments" TO "service_role";

GRANT DELETE ON public."market_data_cache" TO "pool_user";

GRANT INSERT ON public."market_data_cache" TO "pool_user";

GRANT REFERENCES ON public."market_data_cache" TO "pool_user";

GRANT SELECT ON public."market_data_cache" TO "pool_user";

GRANT TRIGGER ON public."market_data_cache" TO "pool_user";

GRANT TRUNCATE ON public."market_data_cache" TO "pool_user";

GRANT UPDATE ON public."market_data_cache" TO "pool_user";

GRANT DELETE ON public."market_data_cache" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."market_data_cache" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."market_data_cache" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."market_data_cache" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."market_data_cache" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."market_data_cache" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."market_data_cache" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."market_data_cache" TO "service_role";

GRANT INSERT ON public."market_data_cache" TO "service_role";

GRANT REFERENCES ON public."market_data_cache" TO "service_role";

GRANT SELECT ON public."market_data_cache" TO "service_role";

GRANT TRIGGER ON public."market_data_cache" TO "service_role";

GRANT TRUNCATE ON public."market_data_cache" TO "service_role";

GRANT UPDATE ON public."market_data_cache" TO "service_role";

GRANT DELETE ON public."orphan_users" TO "pool_user";

GRANT INSERT ON public."orphan_users" TO "pool_user";

GRANT REFERENCES ON public."orphan_users" TO "pool_user";

GRANT SELECT ON public."orphan_users" TO "pool_user";

GRANT TRIGGER ON public."orphan_users" TO "pool_user";

GRANT TRUNCATE ON public."orphan_users" TO "pool_user";

GRANT UPDATE ON public."orphan_users" TO "pool_user";

GRANT DELETE ON public."orphan_users" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."orphan_users" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."orphan_users" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."orphan_users" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."orphan_users" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."orphan_users" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."orphan_users" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."orphan_users" TO "service_role";

GRANT INSERT ON public."orphan_users" TO "service_role";

GRANT REFERENCES ON public."orphan_users" TO "service_role";

GRANT SELECT ON public."orphan_users" TO "service_role";

GRANT TRIGGER ON public."orphan_users" TO "service_role";

GRANT TRUNCATE ON public."orphan_users" TO "service_role";

GRANT UPDATE ON public."orphan_users" TO "service_role";

GRANT DELETE ON public."portfolio_value_snapshots" TO "pool_user";

GRANT INSERT ON public."portfolio_value_snapshots" TO "pool_user";

GRANT REFERENCES ON public."portfolio_value_snapshots" TO "pool_user";

GRANT SELECT ON public."portfolio_value_snapshots" TO "pool_user";

GRANT TRIGGER ON public."portfolio_value_snapshots" TO "pool_user";

GRANT TRUNCATE ON public."portfolio_value_snapshots" TO "pool_user";

GRANT UPDATE ON public."portfolio_value_snapshots" TO "pool_user";

GRANT DELETE ON public."portfolio_value_snapshots" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."portfolio_value_snapshots" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."portfolio_value_snapshots" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."portfolio_value_snapshots" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."portfolio_value_snapshots" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."portfolio_value_snapshots" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."portfolio_value_snapshots" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."portfolio_value_snapshots" TO "service_role";

GRANT INSERT ON public."portfolio_value_snapshots" TO "service_role";

GRANT REFERENCES ON public."portfolio_value_snapshots" TO "service_role";

GRANT SELECT ON public."portfolio_value_snapshots" TO "service_role";

GRANT TRIGGER ON public."portfolio_value_snapshots" TO "service_role";

GRANT TRUNCATE ON public."portfolio_value_snapshots" TO "service_role";

GRANT UPDATE ON public."portfolio_value_snapshots" TO "service_role";

GRANT DELETE ON public."recurring_transactions" TO "pool_user";

GRANT INSERT ON public."recurring_transactions" TO "pool_user";

GRANT REFERENCES ON public."recurring_transactions" TO "pool_user";

GRANT SELECT ON public."recurring_transactions" TO "pool_user";

GRANT TRIGGER ON public."recurring_transactions" TO "pool_user";

GRANT TRUNCATE ON public."recurring_transactions" TO "pool_user";

GRANT UPDATE ON public."recurring_transactions" TO "pool_user";

GRANT DELETE ON public."recurring_transactions" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."recurring_transactions" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."recurring_transactions" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."recurring_transactions" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."recurring_transactions" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."recurring_transactions" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."recurring_transactions" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."recurring_transactions" TO "service_role";

GRANT INSERT ON public."recurring_transactions" TO "service_role";

GRANT REFERENCES ON public."recurring_transactions" TO "service_role";

GRANT SELECT ON public."recurring_transactions" TO "service_role";

GRANT TRIGGER ON public."recurring_transactions" TO "service_role";

GRANT TRUNCATE ON public."recurring_transactions" TO "service_role";

GRANT UPDATE ON public."recurring_transactions" TO "service_role";

GRANT DELETE ON public."transactions" TO "pool_user";

GRANT INSERT ON public."transactions" TO "pool_user";

GRANT REFERENCES ON public."transactions" TO "pool_user";

GRANT SELECT ON public."transactions" TO "pool_user";

GRANT TRIGGER ON public."transactions" TO "pool_user";

GRANT TRUNCATE ON public."transactions" TO "pool_user";

GRANT UPDATE ON public."transactions" TO "pool_user";

GRANT DELETE ON public."transactions" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."transactions" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."transactions" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."transactions" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."transactions" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."transactions" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."transactions" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."transactions" TO "service_role";

GRANT INSERT ON public."transactions" TO "service_role";

GRANT REFERENCES ON public."transactions" TO "service_role";

GRANT SELECT ON public."transactions" TO "service_role";

GRANT TRIGGER ON public."transactions" TO "service_role";

GRANT TRUNCATE ON public."transactions" TO "service_role";

GRANT UPDATE ON public."transactions" TO "service_role";

GRANT DELETE ON public."user_preferences" TO "pool_user";

GRANT INSERT ON public."user_preferences" TO "pool_user";

GRANT REFERENCES ON public."user_preferences" TO "pool_user";

GRANT SELECT ON public."user_preferences" TO "pool_user";

GRANT TRIGGER ON public."user_preferences" TO "pool_user";

GRANT TRUNCATE ON public."user_preferences" TO "pool_user";

GRANT UPDATE ON public."user_preferences" TO "pool_user";

GRANT DELETE ON public."user_preferences" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."user_preferences" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."user_preferences" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."user_preferences" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."user_preferences" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."user_preferences" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."user_preferences" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."user_preferences" TO "service_role";

GRANT INSERT ON public."user_preferences" TO "service_role";

GRANT REFERENCES ON public."user_preferences" TO "service_role";

GRANT SELECT ON public."user_preferences" TO "service_role";

GRANT TRIGGER ON public."user_preferences" TO "service_role";

GRANT TRUNCATE ON public."user_preferences" TO "service_role";

GRANT UPDATE ON public."user_preferences" TO "service_role";

GRANT DELETE ON public."users" TO "pool_user";

GRANT INSERT ON public."users" TO "pool_user";

GRANT REFERENCES ON public."users" TO "pool_user";

GRANT SELECT ON public."users" TO "pool_user";

GRANT TRIGGER ON public."users" TO "pool_user";

GRANT TRUNCATE ON public."users" TO "pool_user";

GRANT UPDATE ON public."users" TO "pool_user";

GRANT DELETE ON public."users" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."users" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."users" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."users" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."users" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."users" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."users" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."users" TO "service_role";

GRANT INSERT ON public."users" TO "service_role";

GRANT REFERENCES ON public."users" TO "service_role";

GRANT SELECT ON public."users" TO "service_role";

GRANT TRIGGER ON public."users" TO "service_role";

GRANT TRUNCATE ON public."users" TO "service_role";

GRANT UPDATE ON public."users" TO "service_role";

GRANT DELETE ON public."users_with_stats" TO "pool_user";

GRANT INSERT ON public."users_with_stats" TO "pool_user";

GRANT REFERENCES ON public."users_with_stats" TO "pool_user";

GRANT SELECT ON public."users_with_stats" TO "pool_user";

GRANT TRIGGER ON public."users_with_stats" TO "pool_user";

GRANT TRUNCATE ON public."users_with_stats" TO "pool_user";

GRANT UPDATE ON public."users_with_stats" TO "pool_user";

GRANT DELETE ON public."users_with_stats" TO "postgres" WITH GRANT OPTION;

GRANT INSERT ON public."users_with_stats" TO "postgres" WITH GRANT OPTION;

GRANT REFERENCES ON public."users_with_stats" TO "postgres" WITH GRANT OPTION;

GRANT SELECT ON public."users_with_stats" TO "postgres" WITH GRANT OPTION;

GRANT TRIGGER ON public."users_with_stats" TO "postgres" WITH GRANT OPTION;

GRANT TRUNCATE ON public."users_with_stats" TO "postgres" WITH GRANT OPTION;

GRANT UPDATE ON public."users_with_stats" TO "postgres" WITH GRANT OPTION;

GRANT DELETE ON public."users_with_stats" TO "service_role";

GRANT INSERT ON public."users_with_stats" TO "service_role";

GRANT REFERENCES ON public."users_with_stats" TO "service_role";

GRANT SELECT ON public."users_with_stats" TO "service_role";

GRANT TRIGGER ON public."users_with_stats" TO "service_role";

GRANT TRUNCATE ON public."users_with_stats" TO "service_role";

GRANT UPDATE ON public."users_with_stats" TO "service_role";

GRANT CREATE ON SCHEMA public TO "pg_database_owner";

GRANT USAGE ON SCHEMA public TO "pg_database_owner";

GRANT USAGE ON SCHEMA public TO "postgres";

GRANT USAGE ON SCHEMA public TO "service_role";

GRANT CREATE ON SCHEMA public TO "pool_user";

GRANT USAGE ON SCHEMA public TO "pool_user";

GRANT EXECUTE ON FUNCTION public."add_budget_period_to_user"(p_user_id uuid, p_start_date date, p_end_date date) TO "postgres";

GRANT EXECUTE ON FUNCTION public."add_budget_period_to_user"(p_user_id uuid, p_start_date date, p_end_date date) TO "service_role";

GRANT EXECUTE ON FUNCTION public."add_budget_period_to_user"(p_user_id uuid, p_start_date date, p_end_date date) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."add_category_to_budget"(p_budget_id uuid, p_category text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."add_category_to_budget"(p_budget_id uuid, p_category text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."add_category_to_budget"(p_budget_id uuid, p_category text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."add_user_to_account"(p_account_id uuid, p_user_id uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION public."add_user_to_account"(p_account_id uuid, p_user_id uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION public."add_user_to_account"(p_account_id uuid, p_user_id uuid) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."add_user_to_group"(p_group_id uuid, p_user_id uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION public."add_user_to_group"(p_group_id uuid, p_user_id uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION public."add_user_to_group"(p_group_id uuid, p_user_id uuid) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."bump_account_balance_version"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."bump_account_balance_version"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."bump_account_balance_version"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."calculate_account_balance"(p_account_id uuid, p_end_date date) TO "postgres";

GRANT EXECUTE ON FUNCTION public."calculate_account_balance"(p_account_id uuid, p_end_date date) TO "service_role";

GRANT EXECUTE ON FUNCTION public."calculate_account_balance"(p_account_id uuid, p_end_date date) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."calculate_next_due_date"(p_current_date date, p_frequency character varying, p_day_of_month integer, p_day_of_week integer, p_month_of_year integer) TO "postgres";

GRANT EXECUTE ON FUNCTION public."calculate_next_due_date"(p_current_date date, p_frequency character varying, p_day_of_month integer, p_day_of_week integer, p_month_of_year integer) TO "service_role";

GRANT EXECUTE ON FUNCTION public."calculate_next_due_date"(p_current_date date, p_frequency character varying, p_day_of_month integer, p_day_of_week integer, p_month_of_year integer) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."category_reference_keys"(p_group_id uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION public."category_reference_keys"(p_group_id uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION public."category_reference_keys"(p_group_id uuid) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."expire_old_invitations"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."expire_old_invitations"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."expire_old_invitations"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_active_budget_period"(p_user_id uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_active_budget_period"(p_user_id uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_active_budget_period"(p_user_id uuid) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_all_categories"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_all_categories"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_all_categories"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_available_share_asset_types"(p_region text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_available_share_asset_types"(p_region text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_available_share_asset_types"(p_region text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_available_share_regions"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_available_share_regions"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_available_share_regions"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_budgets_by_category"(p_category text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_budgets_by_category"(p_category text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_budgets_by_category"(p_category text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_categories_by_theme"(p_color_pattern text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_categories_by_theme"(p_color_pattern text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_categories_by_theme"(p_color_pattern text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_category_by_key"(p_key text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_category_by_key"(p_key text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_category_by_key"(p_key text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_due_recurring_transactions"(p_date date) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_due_recurring_transactions"(p_date date) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_due_recurring_transactions"(p_date date) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_group_category_spending"(p_group_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_group_category_spending"(p_group_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_group_category_spending"(p_group_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_group_monthly_spending"(p_group_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_group_monthly_spending"(p_group_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_group_monthly_spending"(p_group_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_group_user_category_spending"(p_group_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_group_user_category_spending"(p_group_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_group_user_category_spending"(p_group_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_monthly_spending_by_category"(p_user_id uuid, p_year integer, p_month integer) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_monthly_spending_by_category"(p_user_id uuid, p_year integer, p_month integer) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_monthly_spending_by_category"(p_user_id uuid, p_year integer, p_month integer) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_popular_shares"(p_limit integer) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_popular_shares"(p_limit integer) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_popular_shares"(p_limit integer) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_recurring_transactions_by_user"(p_user_id uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_recurring_transactions_by_user"(p_user_id uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_recurring_transactions_by_user"(p_user_id uuid) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_transactions_by_user"(p_user_id uuid, p_limit integer, p_offset integer, p_start_date date, p_end_date date, p_category text, p_type text, p_account_id uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_transactions_by_user"(p_user_id uuid, p_limit integer, p_offset integer, p_start_date date, p_end_date date, p_category text, p_type text, p_account_id uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_transactions_by_user"(p_user_id uuid, p_limit integer, p_offset integer, p_start_date date, p_end_date date, p_category text, p_type text, p_account_id uuid) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_user_accounts"(p_user_clerk_id text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_user_accounts"(p_user_clerk_id text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_user_accounts"(p_user_clerk_id text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_user_budget_total"(p_user_clerk_id text, p_type text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_user_budget_total"(p_user_clerk_id text, p_type text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_user_budget_total"(p_user_clerk_id text, p_type text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_user_budgets"(p_user_clerk_id text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_user_budgets"(p_user_clerk_id text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_user_budgets"(p_user_clerk_id text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_user_by_clerk_id"(p_clerk_id text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_user_by_clerk_id"(p_clerk_id text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_user_by_clerk_id"(p_clerk_id text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_user_by_email"(p_email text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_user_by_email"(p_email text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_user_by_email"(p_email text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_user_groups"(p_user_clerk_id text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_user_groups"(p_user_clerk_id text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_user_groups"(p_user_clerk_id text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."get_users_in_group"(p_user_clerk_id text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."get_users_in_group"(p_user_clerk_id text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."get_users_in_group"(p_user_clerk_id text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."guard_category_delete"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."guard_category_delete"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."guard_category_delete"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."guard_category_reference"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."guard_category_reference"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."guard_category_reference"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."populate_transaction_relations"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."populate_transaction_relations"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."populate_transaction_relations"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."remove_category_from_budget"(p_budget_id uuid, p_category text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."remove_category_from_budget"(p_budget_id uuid, p_category text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."remove_category_from_budget"(p_budget_id uuid, p_category text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."remove_user_from_account"(p_account_id uuid, p_user_id uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION public."remove_user_from_account"(p_account_id uuid, p_user_id uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION public."remove_user_from_account"(p_account_id uuid, p_user_id uuid) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."remove_user_from_group"(p_group_id uuid, p_user_id uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION public."remove_user_from_group"(p_group_id uuid, p_user_id uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION public."remove_user_from_group"(p_group_id uuid, p_user_id uuid) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."update_account_balance"(p_account_id uuid, p_delta numeric) TO "postgres";

GRANT EXECUTE ON FUNCTION public."update_account_balance"(p_account_id uuid, p_delta numeric) TO "service_role";

GRANT EXECUTE ON FUNCTION public."update_account_balance"(p_account_id uuid, p_delta numeric) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."update_accounts_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."update_accounts_updated_at"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."update_accounts_updated_at"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."update_available_shares_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."update_available_shares_updated_at"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."update_available_shares_updated_at"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."update_budgets_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."update_budgets_updated_at"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."update_budgets_updated_at"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."update_categories_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."update_categories_updated_at"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."update_categories_updated_at"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."update_group_invitations_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."update_group_invitations_updated_at"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."update_group_invitations_updated_at"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."update_group_plan"(p_group_id uuid, p_plan_type text, p_plan_name text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."update_group_plan"(p_group_id uuid, p_plan_type text, p_plan_name text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."update_group_plan"(p_group_id uuid, p_plan_type text, p_plan_name text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."update_groups_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."update_groups_updated_at"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."update_groups_updated_at"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."update_recurring_transaction_execution"(p_recurring_transaction_id uuid, p_success boolean) TO "postgres";

GRANT EXECUTE ON FUNCTION public."update_recurring_transaction_execution"(p_recurring_transaction_id uuid, p_success boolean) TO "service_role";

GRANT EXECUTE ON FUNCTION public."update_recurring_transaction_execution"(p_recurring_transaction_id uuid, p_success boolean) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."update_recurring_transactions_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."update_recurring_transactions_updated_at"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."update_recurring_transactions_updated_at"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."update_transactions_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."update_transactions_updated_at"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."update_transactions_updated_at"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."update_updated_at_column"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."update_updated_at_column"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."update_updated_at_column"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."update_user_clerk_id_by_email"(p_email text, p_clerk_id text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."update_user_clerk_id_by_email"(p_email text, p_clerk_id text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."update_user_clerk_id_by_email"(p_email text, p_clerk_id text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."update_user_preferences_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."update_user_preferences_updated_at"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."update_user_preferences_updated_at"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."update_users_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."update_users_updated_at"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."update_users_updated_at"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."upsert_user_by_clerk_id"(p_clerk_id text, p_name text, p_email text, p_avatar text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."upsert_user_by_clerk_id"(p_clerk_id text, p_name text, p_email text, p_avatar text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."upsert_user_by_clerk_id"(p_clerk_id text, p_name text, p_email text, p_avatar text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."user_has_role_permission"(p_user_clerk_id text, p_required_role text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."user_has_role_permission"(p_user_clerk_id text, p_required_role text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."user_has_role_permission"(p_user_clerk_id text, p_required_role text) TO "pool_user";

GRANT EXECUTE ON FUNCTION public."validate_transaction_accounts"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."validate_transaction_accounts"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."validate_transaction_accounts"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."validate_transaction_references"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."validate_transaction_references"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."validate_transaction_references"() TO "pool_user";

GRANT EXECUTE ON FUNCTION public."verify_transaction_population"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."verify_transaction_population"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."verify_transaction_population"() TO "pool_user";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON SEQUENCES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON SEQUENCES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT USAGE ON SEQUENCES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT USAGE ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON SEQUENCES TO "pool_user";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON SEQUENCES TO "pool_user";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT USAGE ON SEQUENCES TO "pool_user";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO "pool_user";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT INSERT ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT MAINTAIN ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRIGGER ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRUNCATE ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON TABLES TO "postgres";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE ON TABLES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT INSERT ON TABLES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT MAINTAIN ON TABLES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES ON TABLES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRIGGER ON TABLES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRUNCATE ON TABLES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON TABLES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE ON TABLES TO "pool_user";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT INSERT ON TABLES TO "pool_user";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT MAINTAIN ON TABLES TO "pool_user";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES ON TABLES TO "pool_user";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO "pool_user";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRIGGER ON TABLES TO "pool_user";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRUNCATE ON TABLES TO "pool_user";

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT UPDATE ON TABLES TO "pool_user";
