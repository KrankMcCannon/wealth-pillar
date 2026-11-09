import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const baselineDirectory = new URL('../../src/server/db/baseline/', import.meta.url);
export const quoteIdentifier = (name) => '"' + name.replaceAll('"', '""') + '"';
const q = quoteIdentifier;
const relation = (name) => `public.${q(name)}`;
const role = (name) => (name === 'PUBLIC' || name === 'public' ? 'PUBLIC' : q(name));

export function renderBaseline(catalog, permissions) {
  const statements = [
    '-- Generated from catalog-only metadata. No application records or credentials.',
    '-- PostgreSQL 17; platform prerequisites: postgres/pool_user/service_role/anon/authenticated roles, auth.uid(), auth.jwt().',
    'SET LOCAL ROLE postgres;',
    'ALTER SCHEMA public OWNER TO pg_database_owner;',
    'SET LOCAL check_function_bodies = off;',
    'SET LOCAL search_path = public, extensions;',
    'CREATE SCHEMA IF NOT EXISTS extensions;',
    ...catalog.extensions.map(
      (e) => `CREATE EXTENSION IF NOT EXISTS ${q(e.name)} WITH SCHEMA ${q(e.schema)};`
    ),
    'REVOKE ALL ON SCHEMA public FROM PUBLIC, anon, authenticated;',
  ];
  for (const table of catalog.tables) {
    if (table.columns.some((column) => column.identity || column.generated))
      throw new Error('Unsupported generated column');
    statements.push(
      `CREATE TABLE ${relation(table.name)} (\n` +
        table.columns
          .map(
            (column) =>
              `  ${q(column.name)} ${column.type}${column.default === null ? '' : ` DEFAULT ${column.default}`}${column.notNull ? ' NOT NULL' : ''}`
          )
          .join(',\n') +
        '\n);'
    );
  }
  // All referenced keys exist before installing any FK, including cycles.
  for (const type of ['p', 'u', 'c', 'f']) {
    for (const constraint of catalog.constraints.filter((c) => c.type === type)) {
      statements.push(
        `ALTER TABLE ${relation(constraint.table)} ADD CONSTRAINT ${q(constraint.name)} ${constraint.definition};`
      );
    }
  }
  for (const index of catalog.indexes.filter((index) => !index.constraint)) {
    if (!index.valid) throw new Error('Baseline contains an invalid index');
    statements.push(index.definition + ';');
  }
  for (const fn of catalog.functions) statements.push(fn.definition.trim() + ';');
  for (const view of catalog.views)
    statements.push(
      `CREATE VIEW ${relation(view.name)}${view.options?.length ? ` WITH (${view.options.join(', ')})` : ''} AS ${view.definition.trim()}`
    );
  for (const trigger of catalog.triggers) {
    statements.push(trigger.definition + ';');
    if (trigger.enabled !== 'O') throw new Error('Review disabled/replica trigger before adopting');
  }
  for (const table of catalog.tables) {
    if (table.rls)
      statements.push(`ALTER TABLE ${relation(table.name)} ENABLE ROW LEVEL SECURITY;`);
    if (table.forceRls)
      statements.push(`ALTER TABLE ${relation(table.name)} FORCE ROW LEVEL SECURITY;`);
  }
  for (const policy of catalog.policies) {
    statements.push(
      `CREATE POLICY ${q(policy.policyname)} ON ${relation(policy.tablename)} AS ${policy.permissive} FOR ${policy.cmd} TO ${policy.roles.map(role).join(', ')}${policy.qual ? ` USING (${policy.qual})` : ''}${policy.with_check ? ` WITH CHECK (${policy.with_check})` : ''};`
    );
  }
  statements.push(
    'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;',
    'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;'
  );
  for (const grant of catalog.grants)
    statements.push(
      `GRANT ${grant.privilege} ON ${relation(grant.table)} TO ${role(grant.role)}${grant.grantable === 'YES' ? ' WITH GRANT OPTION' : ''};`
    );
  for (const grant of permissions.schemaGrants)
    statements.push(
      `GRANT ${grant.privilege} ON SCHEMA public TO ${role(grant.role)}${grant.grantable ? ' WITH GRANT OPTION' : ''};`
    );
  for (const grant of permissions.functionGrants)
    statements.push(
      `GRANT ${grant.privilege} ON FUNCTION ${relation(grant.name)}(${grant.identity}) TO ${role(grant.role)}${grant.grantable ? ' WITH GRANT OPTION' : ''};`
    );
  // Platform-owned default ACLs are not application objects. Preserve the closed
  // schema boundary and explicitly govern defaults for the application DDL owner.
  for (const kind of ['TABLES', 'SEQUENCES', 'FUNCTIONS'])
    statements.push(
      `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON ${kind} FROM PUBLIC, anon, authenticated;`
    );
  for (const grant of permissions.defaultPrivileges.filter((g) => g.owner === 'postgres')) {
    const kind = { r: 'TABLES', S: 'SEQUENCES', f: 'FUNCTIONS' }[grant.type];
    if (!kind) throw new Error('Unsupported default ACL');
    statements.push(
      `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ${grant.privilege} ON ${kind} TO ${role(grant.role)}${grant.grantable ? ' WITH GRANT OPTION' : ''};`
    );
  }
  return statements.join('\n\n') + '\n';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const catalog = JSON.parse(readFileSync(new URL('catalog.json', baselineDirectory), 'utf8'));
  const permissions = JSON.parse(
    readFileSync(new URL('permissions.json', baselineDirectory), 'utf8')
  );
  writeFileSync(
    new URL('0000_verified_baseline.sql', baselineDirectory),
    renderBaseline(catalog, permissions)
  );
}
