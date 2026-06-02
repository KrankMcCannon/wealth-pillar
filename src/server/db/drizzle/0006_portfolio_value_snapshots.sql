CREATE TABLE IF NOT EXISTS "portfolio_value_snapshots" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "snapshot_date" date NOT NULL,
  "value" numeric(15, 2) NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "portfolio_value_snapshots_user_date_unique"
  ON "portfolio_value_snapshots" USING btree ("user_id", "snapshot_date");

CREATE INDEX IF NOT EXISTS "idx_portfolio_snapshots_user_id"
  ON "portfolio_value_snapshots" USING btree ("user_id");

DO $$ BEGIN
  ALTER TABLE "portfolio_value_snapshots"
    ADD CONSTRAINT "portfolio_value_snapshots_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "portfolio_value_snapshots" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own portfolio snapshots"
  ON "portfolio_value_snapshots"
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (
    (auth.uid())::text = (
      SELECT users.clerk_id FROM users WHERE users.id = portfolio_value_snapshots.user_id
    )
  );

CREATE POLICY "Users can insert their own portfolio snapshots"
  ON "portfolio_value_snapshots"
  AS PERMISSIVE
  FOR INSERT
  TO public;

CREATE POLICY "Users can update their own portfolio snapshots"
  ON "portfolio_value_snapshots"
  AS PERMISSIVE
  FOR UPDATE
  TO public;
