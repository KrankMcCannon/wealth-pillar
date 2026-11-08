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
