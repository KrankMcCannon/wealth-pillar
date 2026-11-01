SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';

-- Constant default: existing account balances and ledger rows are unchanged.
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS balance_version bigint DEFAULT 0 NOT NULL;

-- Timestamps can be rewritten by existing triggers or reflect transaction start order.
-- This revision advances under the same row lock as every balance write, from any backend.
CREATE OR REPLACE FUNCTION public.bump_account_balance_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.balance_version := OLD.balance_version + CASE WHEN NEW.balance IS DISTINCT FROM OLD.balance THEN 1 ELSE 0 END;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.bump_account_balance_version() FROM PUBLIC;

DO $$
DECLARE backend_role text;
BEGIN
  FOREACH backend_role IN ARRAY ARRAY['pool_user', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = backend_role) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.bump_account_balance_version() TO %I', backend_role);
    END IF;
  END LOOP;
END;
$$;

DROP TRIGGER IF EXISTS accounts_balance_version ON public.accounts;
CREATE TRIGGER accounts_balance_version
BEFORE UPDATE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.bump_account_balance_version();
