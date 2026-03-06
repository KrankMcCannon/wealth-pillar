-- Atomic balance update function
-- Prevents race conditions when multiple transactions update the same account concurrently.
-- Instead of read-then-write, this uses a single atomic UPDATE ... SET balance = balance + delta.
--
-- Usage: SELECT update_account_balance('account-uuid', 50.00);
-- Returns the new balance after the update.

CREATE OR REPLACE FUNCTION update_account_balance(
  p_account_id UUID,
  p_delta NUMERIC
) RETURNS NUMERIC AS $$
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
$$ LANGUAGE plpgsql;
