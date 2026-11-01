import { beforeAll, beforeEach, afterAll, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/drizzle';
import { getCurrentUser } from '@/lib/auth/cached-auth';
import {
  createBudgetAction,
  getBudgetByIdAction,
  updateBudgetAction,
  deleteBudgetAction,
} from '@/features/budgets/actions/budget-actions';
import {
  createRecurringSeriesAction,
  getRecurringSeriesByIdAction,
  updateRecurringSeriesAction,
  deleteRecurringSeriesAction,
} from '@/features/recurring/actions/recurring-actions';
import { BudgetsRepository } from '@/server/repositories/budgets.repository';
import { InvestmentRepository } from '@/server/repositories/investment.repository';
import { PortfolioSnapshotRepository } from '@/server/repositories/portfolio-snapshot.repository';
import { RECURRING_FREQUENCIES } from '@/lib/recurring/frequencies';
import type { User } from '@/lib/types';

vi.mock('@/lib/auth/cached-auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }));
vi.mock('next/cache', () => ({
  unstable_cache: <T>(fn: T) => fn,
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
}));

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const groupA = id(1);
const groupB = id(2);
const adminA = id(3);
const memberA = id(4);
const adminB = id(5);
const accountA = id(6);
const accountB = id(7);
const viewer = { id: adminA, group_id: groupA, role: 'admin' } as User;

beforeAll(async () => {
  await db.execute(
    sql`CREATE TABLE users (id uuid PRIMARY KEY, clerk_id text, name text, email text, avatar text, theme_color text, budget_start_date integer, group_id uuid, role text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), default_account_id uuid)`
  );
  await db.execute(
    sql`CREATE TABLE accounts (id uuid PRIMARY KEY, name text, type text, user_ids uuid[], group_id uuid, balance numeric DEFAULT 0, liquidity text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now())`
  );
  await db.execute(
    sql`CREATE TABLE budgets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), description text, amount numeric, type text, icon text, categories jsonb, user_id uuid, group_id uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now())`
  );
  await db.execute(
    sql`CREATE TABLE recurring_transactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), description text, amount numeric, type text, category text, frequency text, user_ids text[], account_id uuid, start_date date, end_date date, due_day integer, is_active boolean DEFAULT true, total_executions integer DEFAULT 0, transaction_ids uuid[] DEFAULT '{}', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), CONSTRAINT recurring_transactions_frequency_check CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')))`
  );
  await db.execute(sql`CREATE TABLE transactions (recurring_series_id uuid, date date)`);
  await db.execute(
    sql`CREATE TABLE investments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, name text, symbol text, amount numeric, shares_acquired numeric, currency text, currency_rate numeric, tax_paid numeric, net_earn numeric, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now())`
  );
  await db.execute(
    sql`CREATE TABLE portfolio_value_snapshots (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, snapshot_date date, value numeric, created_at timestamptz DEFAULT now(), UNIQUE (user_id, snapshot_date))`
  );
  const migration = readFileSync(
    new URL('../../src/server/db/drizzle/0005_recurring_frequencies.sql', import.meta.url),
    'utf8'
  );
  await db.execute(sql.raw(migration.replaceAll('--> statement-breakpoint', '\n')));
});

afterAll(async () => {
  await db.execute(
    sql`DROP TABLE IF EXISTS transactions, recurring_transactions, budgets, accounts, portfolio_value_snapshots, investments, users CASCADE`
  );
  await db.$client.end();
});

beforeEach(async () => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue(viewer);
  await db.execute(
    sql`TRUNCATE users, accounts, budgets, recurring_transactions, investments, portfolio_value_snapshots`
  );
  await db.execute(
    sql`INSERT INTO users (id, group_id, role) VALUES (${adminA}, ${groupA}, 'admin'), (${memberA}, ${groupA}, 'member'), (${adminB}, ${groupB}, 'admin')`
  );
  await db.execute(
    sql`INSERT INTO accounts (id, name, type, user_ids, group_id) VALUES (${accountA}, 'Shared A', 'payroll', ARRAY[${adminA}::uuid, ${memberA}::uuid], ${groupA}), (${accountB}, 'Private B', 'payroll', ARRAY[${adminB}::uuid], ${groupB})`
  );
});

const budget = (ownerId = memberA, ownerGroupId = groupA) => ({
  description: 'Food',
  amount: 100,
  type: 'monthly' as const,
  categories: ['food'],
  user_id: ownerId,
  group_id: ownerGroupId,
});
const recurring = (frequency: (typeof RECURRING_FREQUENCIES)[number] = 'monthly') => ({
  description: 'Rent',
  amount: 50,
  type: 'expense' as const,
  category: 'food',
  frequency,
  user_ids: [adminA],
  account_id: accountA,
  start_date: '2026-11-01',
  due_day: 1,
});

it('rejects cross-group budget reads, edits and deletes even for an administrator', async () => {
  const foreign = await BudgetsRepository.create({ ...budget(adminB, groupB), amount: '100' });
  expect((await getBudgetByIdAction(foreign.id)).data).toBeNull();
  expect((await updateBudgetAction(foreign.id, { amount: 1 })).data).toBeNull();
  expect((await deleteBudgetAction(foreign.id)).data).toBeNull();
  expect(Number((await BudgetsRepository.getById(foreign.id))?.amount)).toBe(100);
  expect(await BudgetsRepository.getById(foreign.id, { groupId: groupA })).toBeNull();
  await expect(
    BudgetsRepository.update(foreign.id, { amount: '1' }, { groupId: groupA })
  ).rejects.toThrow();
  await expect(BudgetsRepository.delete(foreign.id, { groupId: groupA })).rejects.toThrow();
});

it('derives the budget group from the session and preserves legitimate administration', async () => {
  expect((await createBudgetAction(budget(adminB, groupA))).data).toBeNull();
  const created = await createBudgetAction(budget(memberA, groupB));
  expect(created.error).toBeNull();
  expect(created.data?.group_id).toBe(groupA);
  const budgetId = created.data!.id;
  expect((await updateBudgetAction(budgetId, { group_id: groupB })).data).toBeNull();
  expect((await updateBudgetAction(budgetId, { user_id: adminB })).data).toBeNull();
  expect((await updateBudgetAction(budgetId, { amount: 150 })).error).toBeNull();
  expect((await deleteBudgetAction(budgetId)).error).toBeNull();
});

it('allows a member to use a shared account but denies foreign accounts and reassignment', async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ ...viewer, id: memberA, role: 'member' });
  const input = { ...recurring(), user_ids: [memberA] };
  expect((await createRecurringSeriesAction({ ...input, account_id: accountB })).data).toBeNull();
  const created = await createRecurringSeriesAction(input);
  expect(created.error).toBeNull();
  expect(
    (await updateRecurringSeriesAction({ id: created.data!.id, account_id: accountB })).data
  ).toBeNull();
  expect(
    (await updateRecurringSeriesAction({ id: created.data!.id, user_ids: [adminB] })).data
  ).toBeNull();
  expect((await getRecurringSeriesByIdAction(created.data!.id)).error).toBeNull();
});

it('prevents administrators from reading or deleting a foreign or corrupt recurring account join', async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ ...viewer, id: adminB, group_id: groupB });
  const foreign = await createRecurringSeriesAction({
    ...recurring(),
    account_id: accountB,
    user_ids: [adminB],
  });
  expect(foreign.error).toBeNull();
  vi.mocked(getCurrentUser).mockResolvedValue(viewer);
  expect((await getRecurringSeriesByIdAction(foreign.data!.id)).data).toBeNull();
  expect(
    (await updateRecurringSeriesAction({ id: foreign.data!.id, is_active: false })).data
  ).toBeNull();
  expect((await deleteRecurringSeriesAction(foreign.data!.id)).data).toBeNull();
  await db.execute(
    sql`UPDATE recurring_transactions SET user_ids = ARRAY[${adminA}] WHERE id = ${foreign.data!.id}`
  );
  expect((await getRecurringSeriesByIdAction(foreign.data!.id)).data).toBeNull();
});

it.each(RECURRING_FREQUENCIES)(
  'saves %s through the action and the migrated PostgreSQL check',
  async (frequency) => {
    const result = await createRecurringSeriesAction(recurring(frequency));
    expect(result.error).toBeNull();
    expect(result.data?.frequency).toBe(frequency);
  }
);

it('rejects frequencies outside the shared product domain at the database boundary', async () => {
  for (const frequency of ['daily', 'quarterly', 'invalid']) {
    await expect(
      db.execute(sql`INSERT INTO recurring_transactions (frequency) VALUES (${frequency})`)
    ).rejects.toThrow();
  }
});

it('atomically invalidates the affected investment history on backdating, editing and deletion', async () => {
  const row = await InvestmentRepository.create({
    user_id: adminA,
    name: 'ETF',
    symbol: 'AAA',
    currency: 'EUR',
    amount: '100',
    shares_acquired: '10',
    created_at: new Date('2026-10-15T12:00:00Z'),
  });
  await PortfolioSnapshotRepository.upsertMany([
    { user_id: adminA, snapshot_date: '2026-10-01', value: '100' },
    { user_id: adminA, snapshot_date: '2026-10-15', value: '100' },
    { user_id: adminB, snapshot_date: '2026-10-15', value: '200' },
  ]);
  await InvestmentRepository.update(
    row!.id,
    { shares_acquired: '12', created_at: new Date('2026-10-05T12:00:00Z') },
    adminA
  );
  expect(
    (await PortfolioSnapshotRepository.findByUserIds([adminA])).map((s) => s.snapshot_date)
  ).toEqual(['2026-10-01']);
  expect(await PortfolioSnapshotRepository.findByUserIds([adminB])).toHaveLength(1);
  await PortfolioSnapshotRepository.upsertMany([
    { user_id: adminA, snapshot_date: '2026-10-10', value: '120' },
  ]);
  expect(await InvestmentRepository.delete(row!.id, adminB)).toBeNull();
  expect(await PortfolioSnapshotRepository.findByUserIds([adminA])).toHaveLength(2);
  await InvestmentRepository.delete(row!.id, adminA);
  expect(await PortfolioSnapshotRepository.findByUserIds([adminA])).toHaveLength(1);
  await InvestmentRepository.create({
    user_id: adminA,
    name: 'Earlier',
    symbol: 'AAA',
    currency: 'EUR',
    amount: '1',
    shares_acquired: '1',
    created_at: new Date('2026-09-01T12:00:00Z'),
  });
  expect(await PortfolioSnapshotRepository.findByUserIds([adminA])).toHaveLength(0);
});
