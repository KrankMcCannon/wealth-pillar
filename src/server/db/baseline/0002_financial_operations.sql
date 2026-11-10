SET LOCAL ROLE postgres;
CREATE TABLE financial_operations (
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  operation_id uuid NOT NULL,
  payload_hash text NOT NULL CHECK(payload_hash ~ '^[a-f0-9]{64}$'),
  result jsonb,
  committed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(group_id,actor_id,kind,operation_id),
  CHECK((result IS NULL) = (committed_at IS NULL))
);
CREATE INDEX financial_operations_actor ON financial_operations(actor_id,created_at);
ALTER TABLE financial_operations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON financial_operations FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON financial_operations TO pool_user,service_role;
