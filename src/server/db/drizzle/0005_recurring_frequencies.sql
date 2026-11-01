-- Run in one transaction. A busy table or incompatible data aborts the operation.
SET LOCAL lock_timeout = '2s';
--> statement-breakpoint
SET LOCAL statement_timeout = '15s';
--> statement-breakpoint
DO $recurring_frequency_migration$
DECLARE
  allowed_values text[];
  validated boolean;
  rows_before bigint;
  rows_after bigint;
  fingerprint_before text;
  fingerprint_after text;
BEGIN
  -- Fail immediately instead of queuing behind application traffic.
  LOCK TABLE ONLY public.recurring_transactions IN ACCESS EXCLUSIVE MODE NOWAIT;

  SELECT c.convalidated,
    ARRAY(SELECT DISTINCT token[1]
      FROM regexp_matches(pg_get_constraintdef(c.oid), $quotes$'([^']+)'$quotes$, 'g') AS token
      ORDER BY 1)
  INTO validated, allowed_values
  FROM pg_constraint c
  WHERE c.conrelid = 'public.recurring_transactions'::regclass
    AND c.conname = 'recurring_transactions_frequency_check'
    AND c.contype = 'c'
    AND c.conkey = ARRAY[(SELECT attnum FROM pg_attribute
      WHERE attrelid = c.conrelid AND attname = 'frequency')]::smallint[];

  IF NOT FOUND OR NOT validated THEN
    RAISE EXCEPTION 'Expected validated recurring frequency check was not found'
      USING ERRCODE = '55000';
  END IF;
  IF allowed_values = ARRAY['biweekly', 'monthly', 'once', 'weekly', 'yearly'] THEN
    RETURN; -- Safe to replay after a separately recorded Supabase deployment.
  END IF;
  IF allowed_values IS DISTINCT FROM ARRAY['daily', 'monthly', 'quarterly', 'weekly', 'yearly'] THEN
    RAISE EXCEPTION 'Unexpected recurring frequency check; manual review required'
      USING ERRCODE = '55000';
  END IF;
  IF EXISTS (SELECT 1 FROM public.recurring_transactions
    WHERE frequency IS NULL OR frequency NOT IN ('biweekly', 'monthly', 'once', 'weekly', 'yearly')) THEN
    RAISE EXCEPTION 'Existing recurring frequencies are incompatible with this migration; no rows were changed'
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*), md5(coalesce(string_agg(md5(row_to_json(t)::text), '' ORDER BY id), ''))
  INTO rows_before, fingerprint_before
  FROM public.recurring_transactions t;

  ALTER TABLE public.recurring_transactions
    DROP CONSTRAINT recurring_transactions_frequency_check,
    ADD CONSTRAINT recurring_transactions_frequency_check CHECK (
      (frequency)::text = ANY ((ARRAY['once'::character varying, 'weekly'::character varying, 'biweekly'::character varying, 'monthly'::character varying, 'yearly'::character varying])::text[])
    );

  SELECT count(*), md5(coalesce(string_agg(md5(row_to_json(t)::text), '' ORDER BY id), ''))
  INTO rows_after, fingerprint_after
  FROM public.recurring_transactions t;
  IF rows_before <> rows_after OR fingerprint_before IS DISTINCT FROM fingerprint_after THEN
    RAISE EXCEPTION 'Recurring rows changed during the constraint migration; rolling back'
      USING ERRCODE = '23514';
  END IF;
END
$recurring_frequency_migration$;
