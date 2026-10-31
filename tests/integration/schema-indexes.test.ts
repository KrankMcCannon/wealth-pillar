import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
import postgres from 'postgres';

it('creates every exported index with its declared operator class on PostgreSQL', async () => {
  const ddl = execFileSync(
    'pnpm',
    ['exec', 'drizzle-kit', 'export', '--config', 'tests/drizzle.e2e.config.ts'],
    { encoding: 'utf8' }
  );
  const tables = [...ddl.matchAll(/CREATE TABLE "([^"]+)" \([\s\S]*?\n\);/g)];
  const indexes = ddl
    .split(';')
    .map((part) => part.trim())
    .filter((part) => /^CREATE (UNIQUE )?INDEX/.test(part));
  expect(tables.length).toBeGreaterThan(10);
  expect(indexes.length).toBeGreaterThan(60);
  const client = postgres(process.env.DATABASE_URL!, { max: 1, onnotice: () => {} });
  const connection = await client.reserve();
  try {
    await connection.unsafe(
      'BEGIN; CREATE SCHEMA index_validation; SET LOCAL search_path TO index_validation, public; CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public; CREATE SCHEMA IF NOT EXISTS extensions; CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;'
    );
    for (const [statement] of tables) {
      await connection.unsafe(statement);
    }
    for (const statement of indexes) await connection.unsafe(statement);
    const [result] =
      await connection`select count(*)::int as count from pg_indexes where schemaname = 'index_validation'`;
    expect(result?.count).toBe(indexes.length);
  } finally {
    await connection.unsafe('ROLLBACK');
    connection.release();
    await client.end();
  }
}, 15000);
