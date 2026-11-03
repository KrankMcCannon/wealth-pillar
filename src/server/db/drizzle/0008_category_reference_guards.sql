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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TRIGGER category_delete_guard BEFORE DELETE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.guard_category_delete();
--> statement-breakpoint
CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.guard_category_reference();
--> statement-breakpoint
CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.guard_category_reference();
--> statement-breakpoint
CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.recurring_transactions FOR EACH ROW EXECUTE FUNCTION public.guard_category_reference();
--> statement-breakpoint
CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.budget_periods FOR EACH ROW EXECUTE FUNCTION public.guard_category_reference();
--> statement-breakpoint
CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.bank_connections FOR EACH ROW EXECUTE FUNCTION public.guard_category_reference();
--> statement-breakpoint
CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.bank_notification_events FOR EACH ROW EXECUTE FUNCTION public.guard_category_reference();
--> statement-breakpoint
CREATE TRIGGER category_reference_guard BEFORE INSERT OR UPDATE ON public.bank_merchant_rules FOR EACH ROW EXECUTE FUNCTION public.guard_category_reference();
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.category_reference_keys(uuid), public.guard_category_reference(), public.guard_category_delete() FROM PUBLIC;
--> statement-breakpoint
DO $$
DECLARE role_name text;
BEGIN
  FOR role_name IN SELECT rolname FROM pg_roles WHERE rolname IN ('pool_user', 'service_role') LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.category_reference_keys(uuid), public.guard_category_reference(), public.guard_category_delete() TO %I', role_name);
  END LOOP;
END $$;
