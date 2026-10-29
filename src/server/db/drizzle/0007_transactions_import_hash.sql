ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "import_hash" text;

CREATE UNIQUE INDEX IF NOT EXISTS "transactions_account_import_hash_unique"
  ON "transactions" USING btree ("account_id", "import_hash")
  WHERE "import_hash" IS NOT NULL;
