-- No financial records are rewritten. Remove the unused device category.
DROP TRIGGER IF EXISTS category_reference_guard ON public.bank_connections;
--> statement-breakpoint
-- Durable category keys behave like foreign keys, including JSON budget references.
-- Existing rows are preserved. Guards apply to new or changed references.
CREATE OR REPLACE FUNCTION public.category_reference_keys(p_group_id uuid)
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
    SELECT e.category FROM public.bank_notification_events e WHERE p_group_id IS NULL OR e.group_id = p_group_id
    UNION ALL
    SELECT r.category FROM public.bank_merchant_rules r WHERE p_group_id IS NULL OR r.group_id = p_group_id
  ) refs WHERE key IS NOT NULL AND key <> '';
$$;

--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.guard_category_reference() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
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
$$;

--> statement-breakpoint
ALTER TABLE public.bank_connections DROP COLUMN IF EXISTS default_category;
