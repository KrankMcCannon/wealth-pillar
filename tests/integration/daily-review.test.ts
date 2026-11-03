import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/drizzle';
import { CategoriesRepository } from '@/server/repositories/categories.repository';
import { MarketDataRepository } from '@/server/repositories/market-data.repository';
import { deleteCategoryAction } from '@/features/categories/actions/category-actions';
import { getCurrentUser } from '@/lib/auth/cached-auth';

vi.mock('@/lib/auth/cached-auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }));
vi.mock('@/lib/utils/cache-utils', () => ({ invalidateCategoryCaches: vi.fn() }));
vi.mock('@/lib/cache', () => ({ cached: (fn: unknown) => fn }));
const group = '00000000-0000-4000-8000-000000000001';
const otherGroup = '00000000-0000-4000-8000-000000000002';
const category = '00000000-0000-4000-8000-000000000003';
const tables = [
  'categories',
  'groups',
  'transactions',
  'budgets',
  'recurring_transactions',
  'budget_periods',
  'accounts',
  'users',
  'bank_connections',
  'bank_notification_events',
  'bank_merchant_rules',
  'market_data_cache',
];
beforeAll(async () => {
  for (const statement of [
    'CREATE TABLE groups (id uuid PRIMARY KEY)',
    'CREATE TABLE categories (id uuid PRIMARY KEY, key text UNIQUE, label text, icon text, color text, group_id uuid REFERENCES groups(id) ON DELETE CASCADE, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now())',
    'CREATE TABLE transactions (category text, group_id uuid)',
    'CREATE TABLE budgets (categories jsonb, group_id uuid)',
    'CREATE TABLE recurring_transactions (category text, account_id uuid)',
    'CREATE TABLE accounts (id uuid PRIMARY KEY, group_id uuid)',
    'CREATE TABLE users (id uuid PRIMARY KEY, group_id uuid)',
    'CREATE TABLE budget_periods (user_id uuid, group_id uuid, budgets_snapshot jsonb, category_spending jsonb)',
    'CREATE TABLE bank_connections (default_category text, group_id uuid)',
    'CREATE TABLE bank_notification_events (category text, group_id uuid)',
    'CREATE TABLE bank_merchant_rules (category text, group_id uuid)',
    "CREATE TABLE market_data_cache (symbol text PRIMARY KEY, data jsonb NOT NULL DEFAULT '[]', last_updated timestamptz NOT NULL DEFAULT now())",
  ])
    await db.execute(sql.raw(statement));
  const migration = readFileSync(
    'src/server/db/drizzle/0008_category_reference_guards.sql',
    'utf8'
  );
  await db.transaction(async (tx) => {
    for (const statement of migration.split('--> statement-breakpoint').filter((s) => s.trim()))
      await tx.execute(sql.raw(statement));
  });
});
afterAll(async () => {
  await db.execute(sql.raw(`DROP TABLE ${tables.join(', ')} CASCADE`));
  await db.execute(
    sql`DROP FUNCTION public.category_reference_keys(uuid), public.guard_category_reference(), public.guard_category_delete()`
  );
  await db.$client.end();
});
beforeEach(async () => {
  await db.execute(sql.raw(`TRUNCATE ${tables.join(', ')}`));
  await db.execute(sql`INSERT INTO groups VALUES (${group})`);
  await db.execute(
    sql`INSERT INTO categories (id, key, label, group_id) VALUES (${category}, 'pets', 'Pets', ${group})`
  );
  await db.execute(sql`INSERT INTO accounts (id, group_id) VALUES (${group}, ${group})`);
  await db.execute(sql`INSERT INTO users (id, group_id) VALUES (${group}, ${group})`);
  vi.mocked(getCurrentUser).mockResolvedValue({ id: group, group_id: group } as never);
});
const references = [
  ['transaction', () => sql`INSERT INTO transactions VALUES ('pets', ${group})`],
  ['budget only', () => sql`INSERT INTO budgets VALUES ('["pets"]', ${group})`],
  ['recurring only', () => sql`INSERT INTO recurring_transactions VALUES ('pets', ${group})`],
  [
    'historical budget only',
    () =>
      sql`INSERT INTO budget_periods VALUES (${group}, NULL, '[{"categories":["pets"]}]', NULL)`,
  ],
  [
    'historical spending only',
    () => sql`INSERT INTO budget_periods VALUES (${group}, ${group}, NULL, '{"pets":17}')`,
  ],
  ['connection', () => sql`INSERT INTO bank_connections VALUES ('pets', ${group})`],
  [
    'pending notification',
    () => sql`INSERT INTO bank_notification_events VALUES ('pets', ${group})`,
  ],
  ['merchant rule', () => sql`INSERT INTO bank_merchant_rules VALUES ('pets', ${group})`],
] as const;
it.each(references)(
  'protects a category referenced by %s on both server and database',
  async (_name, statement) => {
    await db.execute(statement());
    expect(await CategoriesRepository.usedKeys(group)).toEqual(['pets']);
    expect(await CategoriesRepository.usedKeys(otherGroup)).toEqual([]);
    expect(await deleteCategoryAction(category)).toEqual({
      data: null,
      error: 'errors.hasDependencies',
    });
    await expect(db.execute(sql`DELETE FROM categories WHERE id = ${category}`)).rejects.toThrow();
    expect(await CategoriesRepository.findById(category)).not.toBeNull();
  }
);
it('deletes unused categories and rejects writes with a removed key', async () => {
  expect(await deleteCategoryAction(category)).toEqual({ data: { id: category }, error: null });
  await expect(
    db.execute(sql`INSERT INTO budgets VALUES ('["pets"]', ${group})`)
  ).rejects.toThrow();
});
it('keeps foreign groups isolated and permits updates without changing valid references', async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ id: otherGroup, group_id: otherGroup } as never);
  expect((await deleteCategoryAction(category)).error).toBe('errors.permissionDenied');
  await db.execute(sql`INSERT INTO budgets VALUES ('["pets"]', ${group})`);
  await db.execute(sql`UPDATE budgets SET categories = '["pets"]'`);
});
async function waitForLock() {
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    const blocked = await db.execute(
      sql`SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND cardinality(pg_blocking_pids(pid)) > 0`
    );
    if (blocked.length) return;
    await delay(10);
  }
  throw new Error('Expected concurrent writer to wait for a category lock');
}
it.each(['reference-first', 'reference-first-direct', 'delete-first'])(
  'serializes category deletion and reference creation: %s',
  async (order) => {
    let entered!: () => void;
    let release!: () => void;
    const reached = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = db.transaction(async (tx) => {
      await tx.execute(
        order !== 'delete-first'
          ? sql`INSERT INTO budgets VALUES ('["pets"]', ${group})`
          : sql`DELETE FROM categories WHERE id = ${category}`
      );
      entered();
      await hold;
    });
    await reached;
    const second = (
      order === 'reference-first-direct'
        ? db.execute(sql`DELETE FROM categories WHERE id = ${category}`)
        : order === 'reference-first'
          ? CategoriesRepository.delete(category)
          : db.execute(sql`INSERT INTO budgets VALUES ('["pets"]', ${group})`)
    ).then(
      () => null,
      (error) => error
    );
    try {
      await waitForLock();
    } finally {
      release();
    }
    await first;
    expect(await second).toBeInstanceOf(Error);
    const remaining = await CategoriesRepository.findById(category);
    expect(Boolean(remaining)).toBe(order !== 'delete-first');
  }
);
it('preserves cached quotes and their timestamp on empty, invalid or unchanged refreshes', async () => {
  await MarketDataRepository.upsert('AAA', [{ datetime: '2026-10-30', close: '10' }]);
  const first = await MarketDataRepository.findBySymbol('AAA');
  for (const values of [
    [],
    [{ datetime: '2026-02-30', close: 20 }],
    [{ datetime: '2026-11-02', close: 'broken' }],
  ]) {
    await expect(MarketDataRepository.upsert('AAA', values)).rejects.toThrow('No valid quotes');
    expect(await MarketDataRepository.findBySymbol('AAA')).toEqual(first);
  }
  await MarketDataRepository.upsert('AAA', [{ datetime: '2026-10-30', close: '10' }]);
  expect(await MarketDataRepository.findBySymbol('AAA')).toEqual(first);
  await MarketDataRepository.upsert('AAA', [{ datetime: '2026-11-02', close: '12' }]);
  const updated = await MarketDataRepository.findBySymbol('AAA');
  expect(updated?.data).toEqual([
    { datetime: '2026-11-02', close: 12 },
    { datetime: '2026-10-30', close: 10 },
  ]);
});

it('does not prevent the parent group from cascading removal of its own catalog', async () => {
  await db.execute(sql`INSERT INTO budgets VALUES ('["pets"]', ${group})`);
  await db.execute(sql`DELETE FROM groups WHERE id = ${group}`);
  expect(await CategoriesRepository.findById(category)).toBeNull();
});
