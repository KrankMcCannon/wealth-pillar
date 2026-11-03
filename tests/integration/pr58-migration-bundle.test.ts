import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/drizzle';
const bundle = readFileSync('docs/releases/pr58-apply.sql', 'utf8');
const baseTables = [
  'groups',
  'users',
  'accounts',
  'categories',
  'transactions',
  'budgets',
  'recurring_transactions',
  'budget_periods',
];
const id = '00000000-0000-4000-8000-000000000001';
async function clearGuards() {
  await db.execute(
    sql`DROP TABLE IF EXISTS bank_notification_events, bank_merchant_rules, bank_connections CASCADE`
  );
  await db.execute(
    sql`DROP FUNCTION IF EXISTS public.category_reference_keys(uuid), public.guard_category_reference(), public.guard_category_delete() CASCADE`
  );
}
async function runBundle(source = bundle) {
  const connection = await db.$client.reserve();
  try {
    await connection.unsafe(source).simple();
  } catch (error) {
    await connection.unsafe('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
}
beforeAll(async () => {
  for (const statement of [
    'CREATE TABLE groups (id uuid PRIMARY KEY)',
    'CREATE TABLE users (id uuid PRIMARY KEY, group_id uuid)',
    'CREATE TABLE accounts (id uuid PRIMARY KEY, group_id uuid, balance numeric, balance_version bigint)',
    'CREATE TABLE categories (id uuid PRIMARY KEY, key text UNIQUE, group_id uuid)',
    'CREATE TABLE transactions (id uuid PRIMARY KEY, category text, group_id uuid, amount numeric)',
    'CREATE TABLE budgets (categories jsonb, group_id uuid)',
    'CREATE TABLE recurring_transactions (category text, account_id uuid)',
    'CREATE TABLE budget_periods (user_id uuid, group_id uuid, category_spending jsonb, budgets_snapshot jsonb)',
  ])
    await db.execute(sql.raw(statement));
});
beforeEach(async () => {
  await clearGuards();
  await db.execute(sql.raw(`TRUNCATE ${baseTables.join(', ')}`));
  await db.execute(sql`INSERT INTO groups VALUES (${id});`);
  await db.execute(sql`INSERT INTO users VALUES (${id}, ${id});`);
  await db.execute(sql`INSERT INTO accounts VALUES (${id}, ${id}, 100, 7);`);
  await db.execute(sql`INSERT INTO categories VALUES (${id}, 'food', ${id});`);
  await db.execute(sql`INSERT INTO transactions VALUES (${id}, 'food', ${id}, 17);`);
});
afterAll(async () => {
  await clearGuards();
  await db.execute(sql.raw(`DROP TABLE ${baseTables.join(', ')} CASCADE`));
  await db.$client.end();
});
async function baseState() {
  return db.execute(
    sql`SELECT a.balance::text, a.balance_version::text, t.amount::text, t.category FROM accounts a CROSS JOIN transactions t`
  );
}
it('applies the exact two-migration SQL Editor bundle with RLS and guards while preserving financial rows', async () => {
  const before = await baseState();
  await runBundle();
  const tables = await db.execute(
    sql`SELECT relname, relrowsecurity FROM pg_class WHERE oid IN ('public.bank_connections'::regclass, 'public.bank_notification_events'::regclass, 'public.bank_merchant_rules'::regclass)`
  );
  expect(tables).toHaveLength(3);
  expect(tables.every((row) => row.relrowsecurity)).toBe(true);
  const triggers = await db.execute(
    sql`SELECT 1 FROM pg_trigger WHERE NOT tgisinternal AND tgname IN ('category_delete_guard', 'category_reference_guard') AND tgenabled = 'O'`
  );
  expect(triggers).toHaveLength(8);
  expect(await baseState()).toEqual(before);
});
it('rolls back the first migration when the second fails', async () => {
  const before = await baseState();
  await expect(
    runBundle(
      bundle.replace(
        'CREATE FUNCTION public.category_reference_keys',
        'SELECT intentionally_missing_pr58_function();\nCREATE FUNCTION public.category_reference_keys'
      )
    )
  ).rejects.toThrow();
  const objects = await db.execute(
    sql`SELECT to_regclass('public.bank_connections')::text AS bank, to_regprocedure('public.category_reference_keys(uuid)')::text AS guards`
  );
  expect(objects[0]).toEqual({ bank: null, guards: null });
  expect(await baseState()).toEqual(before);
});
it('refuses a second execution without altering the installed objects or financial rows', async () => {
  await runBundle();
  const before = await baseState();
  await expect(runBundle()).rejects.toThrow('PR58 objects already exist');
  expect(await baseState()).toEqual(before);
  const objects = await db.execute(
    sql`SELECT to_regclass('public.bank_connections')::text AS bank`
  );
  expect(objects[0]?.bank).toBe('bank_connections');
});
