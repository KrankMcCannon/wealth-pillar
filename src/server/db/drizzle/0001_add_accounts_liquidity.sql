ALTER TABLE accounts ADD COLUMN IF NOT EXISTS liquidity text;

UPDATE accounts
SET liquidity = CASE
  WHEN type IN ('savings', 'investments') THEN 'reserve'
  ELSE 'spendable'
END
WHERE liquidity IS NULL;
