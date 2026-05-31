-- Transactions list, filter, and search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS transactions_group_date_created_id_idx
  ON transactions (group_id, date DESC, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS transactions_group_user_idx
  ON transactions (group_id, user_id);

CREATE INDEX IF NOT EXISTS transactions_group_account_idx
  ON transactions (group_id, account_id);

CREATE INDEX IF NOT EXISTS transactions_group_category_idx
  ON transactions (group_id, category);

CREATE INDEX IF NOT EXISTS transactions_group_type_idx
  ON transactions (group_id, type);

CREATE INDEX IF NOT EXISTS transactions_description_trgm_idx
  ON transactions USING gin (description gin_trgm_ops);
