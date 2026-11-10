-- Test-only platform adapter, executed inside the fixture transaction.
-- Database objects and roles are rolled back after every migration scenario.
DO $$ BEGIN
  IF current_database() NOT IN ('wealth_pillar_test','wealth_pillar_e2e') THEN RAISE EXCEPTION 'Isolated test database required'; END IF;
END $$;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE ROLE pool_user NOLOGIN BYPASSRLS;
CREATE SCHEMA auth AUTHORIZATION postgres;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS 'SELECT ''{}''::jsonb';
GRANT USAGE ON SCHEMA auth TO pool_user, service_role;
