import { beforeAll, beforeEach, afterAll, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
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
import {
  getAllCategoriesAction,
  updateCategoryAction,
} from '@/features/categories/actions/category-actions';
import * as PeriodActions from '@/features/budgets/actions/budget-period-actions';
import { getTransactionByIdAction } from '@/features/transactions/actions/transaction-actions';
import { getReportPeriodDetailPageData } from '@/server/use-cases/pages/report-period-detail-page.use-case';
import { getReportsPageDataUseCase } from '@/server/use-cases/pages/reports-page.use-case';
import { MarketDataRepository } from '@/server/repositories/market-data.repository';
import { persistPortfolioSnapshotsUseCase } from '@/server/use-cases/investments/persist-portfolio-snapshots.use-case';
import { financialDateKey } from '@/lib/utils/financial-date';
import type { User } from '@/lib/types';

vi.mock('@/lib/auth/cached-auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }));
vi.mock('next/cache', () => ({
  unstable_cache: <T>(fn: T) => fn,
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
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
  await db.execute(
    sql`CREATE TABLE transactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), recurring_series_id uuid, date date, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), description text, category text, type text, frequency text, amount numeric(15,2), user_id uuid, account_id uuid, to_account_id uuid, group_id uuid, import_hash text)`
  );
  await db.execute(
    sql`CREATE TABLE budget_periods (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, group_id uuid, start_date date NOT NULL, end_date date, is_active boolean DEFAULT false, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), spendable_spent numeric, reserve_saved numeric, snapshot_at timestamptz, category_spending jsonb, budgets_snapshot jsonb)`
  );
  await db.execute(
    sql`CREATE TABLE categories (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key text, label text, icon text, color text, group_id uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now())`
  );
  await db.execute(
    sql`CREATE TABLE market_data_cache (symbol text PRIMARY KEY, data jsonb NOT NULL DEFAULT '[]', last_updated timestamptz NOT NULL DEFAULT now())`
  );
  await db.execute(
    sql`CREATE TABLE investments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, name text, symbol text, amount numeric, shares_acquired numeric, currency text, currency_rate numeric, tax_paid numeric, net_earn numeric, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now())`
  );
  await db.execute(
    sql`CREATE TABLE portfolio_value_snapshots (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, snapshot_date date, value numeric, created_at timestamptz DEFAULT now(), UNIQUE (user_id, snapshot_date))`
  );
  await db.transaction((tx) =>
    tx.execute(
      sql.raw(
        readFileSync('src/server/db/drizzle/20261101191621_account_balance_versions.sql', 'utf8')
      )
    )
  );
  const migration = readFileSync(
    new URL('../../src/server/db/drizzle/0005_recurring_frequencies.sql', import.meta.url),
    'utf8'
  );
  await db.execute(sql.raw(migration.replaceAll('--> statement-breakpoint', '\n')));
});

afterAll(async () => {
  await db.execute(
    sql`DROP TABLE IF EXISTS budget_periods, categories, market_data_cache, transactions, recurring_transactions, budgets, accounts, portfolio_value_snapshots, investments, users CASCADE`
  );
  await db.execute(sql`DROP FUNCTION IF EXISTS public.bump_account_balance_version()`);
  await db.$client.end();
});

beforeEach(async () => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue(viewer);
  await db.execute(
    sql`TRUNCATE users, accounts, budgets, recurring_transactions, investments, portfolio_value_snapshots, transactions, budget_periods, categories, market_data_cache`
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

it('guards every budget-period action against foreign users, preserving legitimate admin access', async () => {
  const periodId = id(20);
  await db.execute(
    sql`INSERT INTO budget_periods (id, user_id, group_id, start_date, end_date) VALUES (${periodId}, ${adminB}, ${groupB}, '2026-05-01', '2026-05-31')`
  );
  const attempts = [
    () => PeriodActions.startPeriodAction(adminB, '2026-06-01'),
    () => PeriodActions.closePeriodAction(adminB, periodId, '2026-05-31'),
    () => PeriodActions.editClosingDateAction(adminB, periodId, '2026-05-30'),
    () => PeriodActions.editPeriodDatesAction(adminB, periodId, { startDate: '2026-05-02' }),
    () => PeriodActions.getLatestClosedPeriodAction(adminB),
    () => PeriodActions.deletePeriodAction(adminB, periodId),
    () => PeriodActions.recalculateClosedPeriodAction(adminB, periodId),
    () => PeriodActions.rewindClosedPeriodAction(adminB, periodId),
    () => PeriodActions.getUserPeriodsAction(adminB),
    () => PeriodActions.getActivePeriodAction(adminB),
    () => PeriodActions.getPeriodPreviewAction(adminB, '2026-05-01', '2026-05-31'),
    () => PeriodActions.upsertClosedPeriodBudgetAction(adminB, periodId, budget(adminB, groupB)),
    () => PeriodActions.deleteClosedPeriodBudgetAction(adminB, periodId, id(21)),
  ];
  for (const attempt of attempts) {
    const result = await attempt();
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  }
  expect(await db.execute(sql`SELECT * FROM budget_periods WHERE id = ${periodId}`)).toHaveLength(
    1
  );
  expect((await PeriodActions.getUserPeriodsAction(memberA)).error).toBeNull();
  vi.mocked(getCurrentUser).mockResolvedValue({ ...viewer, id: memberA, role: 'member' });
  expect((await PeriodActions.getUserPeriodsAction(adminA)).data).toBeNull();
  expect((await PeriodActions.getUserPeriodsAction(memberA)).error).toBeNull();
});

it('makes legacy ownerless transactions admin-only, with the SQL ownership scope enforced', async () => {
  const txId = id(30);
  await db.execute(
    sql`INSERT INTO transactions (id, group_id, account_id, amount, type) VALUES (${txId}, ${groupA}, ${accountA}, 1, 'expense')`
  );
  expect((await getTransactionByIdAction(txId)).data?.id).toBe(txId);
  vi.mocked(getCurrentUser).mockResolvedValue({ ...viewer, id: memberA, role: 'member' });
  expect((await getTransactionByIdAction(txId)).data).toBeNull();
});

it('keeps report totals and period detail complete above 5,000 entries, excluding the next Rome day', async () => {
  const periodId = id(40);
  const envelope = { ...budget(adminA), id: id(41), created_at: '', updated_at: '' };
  await db.execute(
    sql`INSERT INTO budget_periods (id, user_id, group_id, start_date, end_date, budgets_snapshot) VALUES (${periodId}, ${adminA}, ${groupA}, '2026-05-01', '2026-05-31', ${JSON.stringify([envelope])}::jsonb)`
  );
  await db.execute(sql`INSERT INTO transactions (description, amount, type, category, date, account_id, user_id, group_id)
    SELECT 'Food', 1, 'expense', 'food', DATE '2026-05-31', ${accountA}::uuid, ${adminA}::uuid, ${groupA}::uuid FROM generate_series(1, 6001)`);
  await db.execute(sql`INSERT INTO transactions (description, amount, type, category, date, account_id, user_id, group_id) VALUES
    ('Other member', 100, 'expense', 'food', '2026-05-31', ${accountA}, ${memberA}, ${groupA}),
    ('Next day', 99999, 'expense', 'food', '2026-06-01', ${accountA}, ${adminA}, ${groupA}),
    ('Foreign', 99999, 'expense', 'food', '2026-05-31', ${accountB}, ${adminB}, ${groupB})`);
  const detail = await getReportPeriodDetailPageData(groupA, periodId, viewer);
  expect(detail.liveAmounts.spendableSpent).toBe(6001);
  expect(detail.budgetProgress[0]?.transactionCount).toBe(6001);
  const report = await getReportsPageDataUseCase(groupA, [adminA, memberA], viewer, {
    preset: 'custom',
    customStart: '2026-05-01',
    customEnd: '2026-05-31',
  });
  expect(report.transactionsTruncated).toBe(false);
  expect(report.sections.all.expenses).toBe(6101);
  expect(report.sections[adminA]?.expenses).toBe(6001);
});

it('retains quotes outside rolling windows and persists only complete closed-day portfolio values', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));
  try {
    await MarketDataRepository.upsert('AAA', [{ datetime: '2026-10-29', close: '10' }]);
    await MarketDataRepository.upsert('AAA', [{ datetime: '2026-10-30', close: '12' }]);
    const cached = await MarketDataRepository.findBySymbol('AAA');
    expect(cached?.data).toHaveLength(2);
    await InvestmentRepository.create({
      user_id: adminA,
      name: 'A',
      symbol: 'AAA',
      amount: '100',
      shares_acquired: '10',
      currency: 'EUR',
      created_at: new Date('2026-10-29T12:00:00Z'),
    });
    await InvestmentRepository.create({
      user_id: adminA,
      name: 'B',
      symbol: 'BBB',
      amount: '20',
      shares_acquired: '2',
      currency: 'EUR',
      created_at: new Date('2026-10-30T12:00:00Z'),
    });
    await persistPortfolioSnapshotsUseCase(adminA);
    let snapshots = await PortfolioSnapshotRepository.findByUserIds([adminA]);
    expect(snapshots.map((s) => s.snapshot_date)).toEqual(['2026-10-29']);
    await MarketDataRepository.upsert('BBB', [{ datetime: '2026-10-30', close: '5' }]);
    await persistPortfolioSnapshotsUseCase(adminA);
    await persistPortfolioSnapshotsUseCase(adminA);
    snapshots = await PortfolioSnapshotRepository.findByUserIds([adminA]);
    expect(snapshots.map((s) => [s.snapshot_date, Number(s.value)])).toEqual([
      ['2026-10-29', 100],
      ['2026-10-30', 130],
      ['2026-10-31', 130],
    ]);
    expect(snapshots.every((s) => s.snapshot_date < financialDateKey(new Date()))).toBe(true);
    const lot = (await InvestmentRepository.findByUser(adminA))[0]!;
    await InvestmentRepository.update(lot.id, { shares_acquired: '12' }, adminA);
    await persistPortfolioSnapshotsUseCase(adminA);
    expect(Number((await PortfolioSnapshotRepository.findByUserIds([adminA]))[0]?.value)).toBe(120);
  } finally {
    vi.useRealTimers();
  }
});

it('isolates category catalogs and keeps durable references stable when a label changes', async () => {
  const categoryId = id(50);
  await db.execute(sql`INSERT INTO categories (id, key, label, icon, color, group_id) VALUES
    (${categoryId}, 'food', 'Food', 'ShoppingCart', '#555555', ${groupA}),
    (${id(51)}, 'private_b', 'Private B', 'ShoppingCart', '#555555', ${groupB}),
    (${id(52)}, 'default', 'Default', 'ShoppingCart', '#555555', '00000000-0000-0000-0000-000000000000')`);
  expect((await getAllCategoriesAction()).data?.map((c) => c.key).sort()).toEqual([
    'default',
    'food',
  ]);
  await db.execute(
    sql`INSERT INTO transactions (category, group_id) VALUES ('food', ${groupA}), ('food', ${groupB})`
  );
  const renamed = await updateCategoryAction(categoryId, { label: 'Groceries' });
  expect(renamed.error).toBeNull();
  expect(renamed.data?.key).toBe('food');
  expect(renamed.data?.label).toBe('Groceries');
  expect(
    (await db.execute(sql`SELECT category FROM transactions`)).map((row) => row.category)
  ).toEqual(['food', 'food']);
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  expect((await getAllCategoriesAction()).data?.map((c) => c.key)).toEqual(['default']);
});

it('runs the production snapshot CLI against the local fixture', async () => {
  await MarketDataRepository.upsert('AAA', [{ datetime: '2026-10-30', close: '10' }]);
  await InvestmentRepository.create({
    user_id: adminA,
    name: 'A',
    symbol: 'AAA',
    amount: '100',
    shares_acquired: '10',
    currency: 'EUR',
    created_at: new Date('2026-10-30T12:00:00Z'),
  });
  const output = execFileSync(
    process.execPath,
    ['node_modules/tsx/dist/cli.mjs', 'scripts/persist-portfolio-snapshots.ts'],
    { encoding: 'utf8', env: process.env }
  );
  expect(output).toContain('Portfolio rebuilt:');
  expect((await PortfolioSnapshotRepository.findByUserIds([adminA])).length).toBeGreaterThan(0);
});

it.each(['projection-first', 'mutation-first'] as const)(
  'coordinates snapshot rebuild and holding edits (%s)',
  async (order) => {
    await MarketDataRepository.upsert('AAA', [{ datetime: '2026-10-30', close: '10' }]);
    const lot = await InvestmentRepository.create({
      user_id: adminA,
      name: 'A',
      symbol: 'AAA',
      amount: '100',
      shares_acquired: '10',
      currency: 'EUR',
      created_at: new Date('2026-10-30T12:00:00Z'),
    });
    let release!: () => void;
    let entered!: () => void;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    const reached = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const quoteRead = MarketDataRepository.findBySymbols.bind(MarketDataRepository);
    const invalidate = PortfolioSnapshotRepository.deleteFrom.bind(PortfolioSnapshotRepository);
    const spy =
      order === 'projection-first'
        ? vi
            .spyOn(MarketDataRepository, 'findBySymbols')
            .mockImplementationOnce(async (...args) => {
              const rows = await quoteRead(...args);
              entered();
              await hold;
              return rows;
            })
        : vi
            .spyOn(PortfolioSnapshotRepository, 'deleteFrom')
            .mockImplementationOnce(async (...args) => {
              await invalidate(...args);
              entered();
              await hold;
            });
    try {
      const first =
        order === 'projection-first'
          ? persistPortfolioSnapshotsUseCase(adminA)
          : InvestmentRepository.update(lot!.id, { shares_acquired: '12' }, adminA);
      await reached;
      const second =
        order === 'projection-first'
          ? InvestmentRepository.update(lot!.id, { shares_acquired: '12' }, adminA)
          : persistPortfolioSnapshotsUseCase(adminA);
      await delay(25);
      release();
      await Promise.all([first, second]);
      if (order === 'projection-first')
        expect(await PortfolioSnapshotRepository.findByUserIds([adminA])).toHaveLength(0);
      spy.mockRestore();
      await persistPortfolioSnapshotsUseCase(adminA);
      expect(
        (await PortfolioSnapshotRepository.findByUserIds([adminA])).every(
          (row) => Number(row.value) === 120
        )
      ).toBe(true);
    } finally {
      release();
      spy.mockRestore();
    }
  }
);
