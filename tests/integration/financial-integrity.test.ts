import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setTimeout as delay } from 'node:timers/promises';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/drizzle';
import { updateUserPreferencesUseCase } from '@/server/use-cases/users/update-user-preferences.use-case';
import { UserPreferencesRepository } from '@/server/repositories/user-preferences.repository';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import {
  deleteAccountUseCase,
  recalculateAccountBalanceUseCase,
} from '@/server/use-cases/accounts/account.use-cases';
import { createTransactionUseCase } from '@/server/use-cases/transactions/create-transaction.use-case';
import { sumAccountBalanceFromRows } from '@/server/use-cases/transactions/transaction-balance-delta.core';
import { recalculateClosedPeriodSnapshotUseCase } from '@/server/use-cases/budget-periods/recalculate-closed-period.use-case';
import { closeBudgetPeriodUseCase } from '@/server/use-cases/budget-periods/close-budget-period.use-case';
import { createBudgetPeriodUseCase } from '@/server/use-cases/budget-periods/create-budget-period.use-case';
import { editPeriodDatesUseCase } from '@/server/use-cases/budget-periods/edit-closing-date.use-case';
import { getBudgetsByUserUseCase } from '@/server/use-cases/budgets/get-budgets.use-case';
import { UsersRepository } from '@/server/repositories/users.repository';
import {
  getReportsContextUseCase,
  getReportsPeriodSummariesUseCase,
  getReportsTransactionsUseCase,
} from '@/server/use-cases/reports/reports.use-cases';
import { getReportsPageDataUseCase } from '@/server/use-cases/pages/reports-page.use-case';
import type { Budget, User } from '@/lib/types';
import { updateTransactionUseCase } from '@/server/use-cases/transactions/update-transaction.use-case';
import { deleteTransactionUseCase } from '@/server/use-cases/transactions/delete-transaction.use-case';
import { bulkCreateTransactionsUseCase } from '@/server/use-cases/transactions/bulk-create-transactions.use-case';
import {
  prepareImportRowProofs,
  verifyImportRowProof,
} from '@/server/use-cases/transactions/import-row-proof';
import type { PreparedImportRowInput } from '@/lib/import/types';
import {
  invalidateAccountCaches,
  invalidateTransactionCaches,
  invalidateTransactionUpdateCaches,
} from '@/lib/utils/cache-utils';

vi.mock('next/cache', () => ({
  unstable_cache: <T>(fn: T) => fn,
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));
vi.mock('@/server/use-cases/budgets/get-budgets.use-case', () => ({
  getBudgetsByUserUseCase: vi.fn(),
  getBudgetsByGroupUseCase: vi.fn(),
}));
vi.mock('@/server/use-cases/reports/reports.use-cases', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/use-cases/reports/reports.use-cases')>()),
  getReportsContextUseCase: vi.fn(),
}));
vi.mock('@/lib/utils/cache-utils', () => ({
  invalidateAccountCaches: vi.fn(),
  invalidateTransactionCaches: vi.fn(),
  invalidateTransactionUpdateCaches: vi.fn(),
  invalidateBudgetPeriodCaches: vi.fn(),
}));

const groupId = '00000000-0000-4000-8000-000000000001';
const userId = '00000000-0000-4000-8000-000000000002';
const a = '00000000-0000-4000-8000-000000000003';
const b = '00000000-0000-4000-8000-000000000004';

beforeAll(async () => {
  await db.execute(sql`CREATE TABLE user_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
    currency varchar(3) NOT NULL DEFAULT 'EUR', language varchar(5) NOT NULL DEFAULT 'it-IT',
    timezone varchar(50) NOT NULL DEFAULT 'Europe/Rome', notifications_push boolean NOT NULL DEFAULT true,
    notifications_email boolean NOT NULL DEFAULT false, notifications_budget_alerts boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  // Minimal production-shaped tables in the guarded, disposable local database.
  await db.execute(sql`CREATE TABLE accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, type text NOT NULL,
    user_ids uuid[] NOT NULL, group_id uuid NOT NULL, balance numeric(12,2) DEFAULT 0,
    liquidity text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
  )`);
  await db.execute(sql`CREATE TABLE transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), description text NOT NULL, amount numeric(15,2) NOT NULL,
    type varchar(10) NOT NULL, category varchar(255) NOT NULL, date date NOT NULL,
    account_id uuid NOT NULL, to_account_id uuid, user_id uuid, group_id uuid, recurring_series_id uuid,
    frequency varchar(20), import_hash text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
  )`);
  await db.execute(sql`CREATE TABLE budget_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, group_id uuid,
    start_date date NOT NULL, end_date date, is_active boolean DEFAULT false,
    spendable_spent numeric, reserve_saved numeric, category_spending jsonb DEFAULT '{}',
    snapshot_at timestamptz, budgets_snapshot jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
  )`);
  await db.execute(sql`CREATE UNIQUE INDEX transactions_account_import_hash_unique
    ON transactions (account_id, import_hash) WHERE import_hash IS NOT NULL`);
  await db.execute(
    sql`CREATE UNIQUE INDEX idx_budget_periods_one_active_per_user ON budget_periods (user_id) WHERE is_active = true`
  );
});

afterAll(async () => {
  await db.execute(
    sql`DROP TABLE IF EXISTS transactions, accounts, budget_periods, user_preferences CASCADE`
  );
  await db.execute(sql`DROP FUNCTION IF EXISTS fail_account_delete()`);
  await db.$client.end();
});

beforeEach(async () => {
  vi.clearAllMocks();
  vi.stubEnv('CLERK_SECRET_KEY', 'local-integration-test-key');
  vi.mocked(getBudgetsByUserUseCase).mockResolvedValue([foodBudget()]);
  await db.execute(sql`TRUNCATE accounts, transactions, budget_periods, user_preferences`);
  await AccountsRepository.create({
    id: a,
    name: 'A',
    type: 'payroll',
    liquidity: 'spendable',
    user_ids: [userId],
    group_id: groupId,
    balance: '800',
  });
  await AccountsRepository.create({
    id: b,
    name: 'B',
    type: 'payroll',
    liquidity: 'spendable',
    user_ids: [userId],
    group_id: groupId,
    balance: '700',
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('account deletion against PostgreSQL', () => {
  it.each(['outgoing', 'incoming'] as const)(
    'reconciles %s transfers and preserves unrelated rows',
    async (direction) => {
      const outgoing = direction === 'outgoing';
      await AccountsRepository.update(b, { balance: outgoing ? '700' : '300' });
      const transfer = await TransactionsRepository.create({
        description: 'Transfer',
        amount: '200',
        type: 'transfer',
        category: 'transfer',
        date: '2024-05-10',
        user_id: userId,
        group_id: groupId,
        account_id: outgoing ? a : b,
        to_account_id: outgoing ? b : a,
      });
      const income = await TransactionsRepository.create({
        description: 'Unrelated income',
        amount: '500',
        type: 'income',
        category: 'salary',
        date: '2024-05-01',
        user_id: userId,
        group_id: groupId,
        account_id: b,
      });
      if (!transfer || !income) throw new Error('Failed to seed transactions');
      await deleteAccountUseCase(a);
      expect(await AccountsRepository.findById(a)).toBeNull();
      expect(Number((await AccountsRepository.findById(b))?.balance)).toBe(500);
      expect(await TransactionsRepository.getById(transfer.id)).toBeNull();
      expect(await TransactionsRepository.getById(income.id)).not.toBeNull();
      expect(invalidateTransactionCaches).toHaveBeenCalledWith(
        expect.objectContaining({ transactionId: transfer.id, toAccountId: outgoing ? b : a })
      );
      await expect(deleteAccountUseCase(a)).rejects.toThrow('Account not found');
      expect(Number((await AccountsRepository.findById(b))?.balance)).toBe(500);
    }
  );

  it('rolls back the ledger and surviving balance if account deletion fails', async () => {
    const transfer = await TransactionsRepository.create({
      description: 'Transfer',
      amount: '200',
      type: 'transfer',
      category: 'transfer',
      date: '2024-05-10',
      user_id: userId,
      group_id: groupId,
      account_id: a,
      to_account_id: b,
    });
    if (!transfer) throw new Error('Failed to seed transfer');
    await db.execute(
      sql`CREATE FUNCTION fail_account_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced delete failure'; END $$`
    );
    await db.execute(
      sql`CREATE TRIGGER fail_delete BEFORE DELETE ON accounts FOR EACH ROW EXECUTE FUNCTION fail_account_delete()`
    );
    try {
      await expect(deleteAccountUseCase(a)).rejects.toThrow();
      expect(await AccountsRepository.findById(a)).not.toBeNull();
      expect(await TransactionsRepository.getById(transfer.id)).not.toBeNull();
      expect(Number((await AccountsRepository.findById(b))?.balance)).toBe(700);
      expect(invalidateAccountCaches).not.toHaveBeenCalled();
      expect(invalidateTransactionCaches).not.toHaveBeenCalled();
    } finally {
      await db.execute(sql`DROP TRIGGER fail_delete ON accounts`);
    }
  });
});

describe('historical snapshots against PostgreSQL', () => {
  it('includes all 6,000 historical expenses despite 6,000 more recent rows', async () => {
    await db.execute(sql`INSERT INTO transactions (description, amount, type, category, date, account_id, user_id, group_id)
      SELECT 'Historical', 1, 'expense', 'food', DATE '2024-05-10', ${a}::uuid, ${userId}::uuid, ${groupId}::uuid FROM generate_series(1, 6000)
      UNION ALL
      SELECT 'Recent', 10, 'expense', 'food', DATE '2026-05-10', ${a}::uuid, ${userId}::uuid, ${groupId}::uuid FROM generate_series(1, 6000)`);
    const period = await BudgetPeriodsRepository.create({
      user_id: userId,
      group_id: groupId,
      start_date: '2024-05-01',
      end_date: '2024-05-31',
      is_active: false,
      budgets_snapshot: [
        {
          id: 'food-budget',
          description: 'Food',
          amount: 10000,
          type: 'monthly',
          categories: ['food'],
          user_id: userId,
          group_id: groupId,
        },
      ],
    });
    await recalculateClosedPeriodSnapshotUseCase(userId, period.id);
    const saved = await BudgetPeriodsRepository.findById(period.id);
    expect(Number(saved?.spendable_spent)).toBe(6000);
    expect(saved?.category_spending).toEqual({ food: 6000 });
    expect(saved?.snapshot_at).not.toBeNull();
  });

  it('does not overwrite a snapshot if ledger loading fails', async () => {
    const period = await BudgetPeriodsRepository.create({
      user_id: userId,
      group_id: groupId,
      start_date: '2024-05-01',
      end_date: '2024-05-31',
      spendable_spent: '42',
      snapshot_at: new Date('2024-06-01'),
    });
    const spy = vi
      .spyOn(TransactionsRepository, 'getByGroup')
      .mockRejectedValueOnce(new Error('unavailable'));
    try {
      await expect(recalculateClosedPeriodSnapshotUseCase(userId, period.id)).rejects.toThrow(
        'unavailable'
      );
      expect(Number((await BudgetPeriodsRepository.findById(period.id))?.spendable_spent)).toBe(42);
    } finally {
      spy.mockRestore();
    }
  });
});

async function seedMovement(type: 'expense' | 'transfer') {
  await AccountsRepository.update(a, { balance: '90' });
  await AccountsRepository.update(b, { balance: type === 'transfer' ? '510' : '500' });
  const row = await TransactionsRepository.create({
    description: 'Movement',
    amount: '10',
    type,
    category: 'food',
    date: '2026-06-01',
    account_id: a,
    to_account_id: type === 'transfer' ? b : null,
    group_id: groupId,
    user_id: userId,
  });
  if (!row) throw new Error('Failed to seed transaction');
  return row;
}

describe('concurrent financial mutations against PostgreSQL', () => {
  it.each(['expense', 'transfer'] as const)('serializes two edits of the same %s', async (type) => {
    const row = await seedMovement(type);
    const update = TransactionsRepository.update.bind(TransactionsRepository);
    // Give both requests time to enter while the first write is pending.
    vi.spyOn(TransactionsRepository, 'update').mockImplementation(async (...args) => {
      await delay(25);
      return update(...args);
    });
    await Promise.all([
      updateTransactionUseCase(row.id, { amount: 20 }, { groupId }),
      updateTransactionUseCase(row.id, { amount: 30 }, { groupId }),
    ]);
    const saved = await TransactionsRepository.getById(row.id);
    expect(Number((await AccountsRepository.findById(a))?.balance)).toBe(
      100 - Number(saved?.amount)
    );
    expect(Number((await AccountsRepository.findById(b))?.balance)).toBe(
      type === 'transfer' ? 500 + Number(saved?.amount) : 500
    );
  });

  it.each(['expense', 'transfer'] as const)(
    'reverses a double deletion of the same %s only once',
    async (type) => {
      const row = await seedMovement(type);
      const remove = TransactionsRepository.delete.bind(TransactionsRepository);
      vi.spyOn(TransactionsRepository, 'delete').mockImplementation(async (...args) => {
        await delay(25);
        return remove(...args);
      });
      const results = await Promise.allSettled([
        deleteTransactionUseCase(row.id, { groupId }),
        deleteTransactionUseCase(row.id, { groupId }),
      ]);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      expect(await TransactionsRepository.getById(row.id)).toBeNull();
      expect(Number((await AccountsRepository.findById(a))?.balance)).toBe(100);
      expect(Number((await AccountsRepository.findById(b))?.balance)).toBe(500);
      expect(invalidateTransactionCaches).toHaveBeenCalledTimes(1);
    }
  );

  it('keeps balances consistent when a transfer is edited and deleted concurrently', async () => {
    const row = await seedMovement('transfer');
    const results = await Promise.allSettled([
      updateTransactionUseCase(row.id, { amount: 25 }, { groupId }),
      deleteTransactionUseCase(row.id, { groupId }),
    ]);
    expect(results[1]?.status).toBe('fulfilled');
    expect(await TransactionsRepository.getById(row.id)).toBeNull();
    expect(Number((await AccountsRepository.findById(a))?.balance)).toBe(100);
    expect(Number((await AccountsRepository.findById(b))?.balance)).toBe(500);
  });

  it('uses the same account lock order for opposing transfers', async () => {
    const first = await seedMovement('transfer');
    const second = await TransactionsRepository.create({
      description: 'Reverse',
      amount: '10',
      type: 'transfer',
      category: 'transfer',
      date: '2026-06-01',
      account_id: b,
      to_account_id: a,
      group_id: groupId,
      user_id: userId,
    });
    if (!second) throw new Error('Failed to seed transfer');
    await AccountsRepository.update(a, { balance: '100' });
    await AccountsRepository.update(b, { balance: '500' });
    await Promise.all([
      updateTransactionUseCase(first.id, { amount: 20 }, { groupId }),
      updateTransactionUseCase(second.id, { amount: 30 }, { groupId }),
    ]);
    expect(Number((await AccountsRepository.findById(a))?.balance)).toBe(110);
    expect(Number((await AccountsRepository.findById(b))?.balance)).toBe(490);
  });

  it('rolls back the row and first balance if updating the second account fails', async () => {
    const row = await seedMovement('transfer');
    await db.execute(
      sql`CREATE FUNCTION fail_balance_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced balance failure'; END $$`
    );
    await db.execute(
      sql`CREATE TRIGGER fail_balance_update BEFORE UPDATE ON accounts FOR EACH ROW WHEN (NEW.name = 'B') EXECUTE FUNCTION fail_balance_update()`
    );
    try {
      await expect(updateTransactionUseCase(row.id, { amount: 30 }, { groupId })).rejects.toThrow();
      expect(Number((await TransactionsRepository.getById(row.id))?.amount)).toBe(10);
      expect(Number((await AccountsRepository.findById(a))?.balance)).toBe(90);
      expect(Number((await AccountsRepository.findById(b))?.balance)).toBe(510);
      expect(invalidateTransactionUpdateCaches).not.toHaveBeenCalled();
    } finally {
      await db.execute(sql`DROP TRIGGER fail_balance_update ON accounts`);
      await db.execute(sql`DROP FUNCTION fail_balance_update()`);
    }
  });

  it('enforces ownership scope on the row actually mutated', async () => {
    const row = await seedMovement('expense');
    await TransactionsRepository.update(row.id, {
      user_id: '00000000-0000-4000-8000-000000000099',
    });
    await expect(
      updateTransactionUseCase(row.id, { amount: 30 }, { groupId, userId })
    ).rejects.toThrow('Transaction not found');
    await expect(deleteTransactionUseCase(row.id, { groupId, userId })).rejects.toThrow(
      'Transaction not found'
    );
    expect(Number((await AccountsRepository.findById(a))?.balance)).toBe(90);
    expect(await TransactionsRepository.getById(row.id)).not.toBeNull();
  });
});

const importContext = { userId, groupId };
const coffee = {
  rowId: 'coffee-0',
  account_id: a,
  description: 'Coffee',
  amount: 10,
  type: 'expense' as const,
  date: '2026-06-01',
};
async function commitPrepared(rows: PreparedImportRowInput[]) {
  for (const row of rows) await verifyImportRowProof(row, importContext);
  return bulkCreateTransactionsUseCase(
    rows.map((row) => ({ ...row, group_id: groupId, user_id: userId, category: 'food' }))
  );
}

describe('idempotent CSV imports against the real partial unique index', () => {
  it('inserts once, skips a repeat, and inserts only new rows in a mixed import', async () => {
    const rows = await prepareImportRowProofs(
      [coffee, { ...coffee, rowId: 'refund', description: 'Refund', type: 'income', amount: 20 }],
      importContext
    );
    expect(await commitPrepared(rows)).toEqual({ inserted: 2, skipped: 0 });
    expect(Number((await AccountsRepository.findById(a))?.balance)).toBe(810);
    expect(await commitPrepared(rows)).toEqual({ inserted: 0, skipped: 2 });
    const mixed = await prepareImportRowProofs(
      [coffee, { ...coffee, rowId: 'new', description: 'Snack', amount: 5 }],
      importContext
    );
    expect(await commitPrepared(mixed)).toEqual({ inserted: 1, skipped: 1 });
    expect(Number((await AccountsRepository.findById(a))?.balance)).toBe(805);
  });

  it('preserves identical legitimate rows and their identities across partial selections', async () => {
    const source = [coffee, { ...coffee, rowId: 'coffee-1' }];
    const rows = await prepareImportRowProofs(source, importContext);
    expect(await commitPrepared([rows[1]!])).toEqual({ inserted: 1, skipped: 0 });
    const reuploaded = await prepareImportRowProofs(source, importContext);
    expect(await commitPrepared(reuploaded)).toEqual({ inserted: 1, skipped: 1 });
    expect(await commitPrepared(reuploaded)).toEqual({ inserted: 0, skipped: 2 });
    expect(Number((await AccountsRepository.findById(a))?.balance)).toBe(780);
  });

  it('updates balances only once when the same import is committed concurrently', async () => {
    const rows = await prepareImportRowProofs(
      [coffee, { ...coffee, rowId: 'refund', description: 'Refund', type: 'income', amount: 20 }],
      importContext
    );
    const results = await Promise.all([commitPrepared(rows), commitPrepared(rows)]);
    expect(results.reduce((sum, result) => sum + result.inserted, 0)).toBe(2);
    expect(results.reduce((sum, result) => sum + result.skipped, 0)).toBe(2);
    expect(Number((await AccountsRepository.findById(a))?.balance)).toBe(810);
  });
});

function foodBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'food-budget',
    description: 'Food',
    amount: 100,
    type: 'monthly',
    categories: ['food'],
    user_id: userId,
    group_id: groupId,
    icon: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

async function createTimeline() {
  const previous = await BudgetPeriodsRepository.create({
    user_id: userId,
    group_id: groupId,
    start_date: '2024-04-01',
    end_date: '2024-04-30',
    is_active: false,
    budgets_snapshot: [foodBudget()],
    snapshot_at: new Date('2024-05-01'),
  });
  const current = await BudgetPeriodsRepository.create({
    user_id: userId,
    group_id: groupId,
    start_date: '2024-05-01',
    end_date: '2024-05-31',
    is_active: false,
    budgets_snapshot: [foodBudget()],
    snapshot_at: new Date('2024-06-01'),
  });
  const next = await BudgetPeriodsRepository.create({
    user_id: userId,
    group_id: groupId,
    start_date: '2024-06-01',
    end_date: null,
    is_active: true,
  });
  return { previous, current, next };
}

describe('budget period lifecycle and timeline integrity', () => {
  it('refuses a second close without replacing historical budgets or totals', async () => {
    const active = await BudgetPeriodsRepository.create({
      user_id: userId,
      group_id: groupId,
      start_date: '2024-05-01',
      end_date: null,
      is_active: true,
    });
    await closeBudgetPeriodUseCase(userId, active.id, '2024-05-31');
    const before = await BudgetPeriodsRepository.findById(active.id);
    vi.mocked(getBudgetsByUserUseCase).mockResolvedValue([foodBudget({ amount: 999 })]);
    await expect(closeBudgetPeriodUseCase(userId, active.id, '2024-05-25')).rejects.toMatchObject({
      code: 'periodNotOpen',
    });
    expect(await BudgetPeriodsRepository.findById(active.id)).toEqual(before);
    expect(before?.budgets_snapshot).toEqual([foodBudget()]);
  });

  it('allows only one of two concurrent closing requests to succeed', async () => {
    const active = await BudgetPeriodsRepository.create({
      user_id: userId,
      group_id: groupId,
      start_date: '2024-05-01',
      end_date: null,
      is_active: true,
    });
    const results = await Promise.allSettled([
      closeBudgetPeriodUseCase(userId, active.id, '2024-05-30'),
      closeBudgetPeriodUseCase(userId, active.id, '2024-05-31'),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const saved = await BudgetPeriodsRepository.findById(active.id);
    expect(saved?.is_active).toBe(false);
    expect(saved?.budgets_snapshot).toEqual([foodBudget()]);
  });

  it.each(['2024-04-01', '2024-06-01'])(
    'rolls back every date and snapshot if updating the neighbor starting %s fails',
    async (failingStart) => {
      const { current } = await createTimeline();
      const before = await BudgetPeriodsRepository.findByUser(userId);
      await db.execute(
        sql`CREATE FUNCTION fail_period_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced period failure'; END $$`
      );
      // Dates are fixed test cases, not external input.
      await db.execute(
        sql.raw(
          `CREATE TRIGGER fail_period_update BEFORE UPDATE ON budget_periods FOR EACH ROW WHEN (OLD.start_date = DATE '${failingStart}') EXECUTE FUNCTION fail_period_update()`
        )
      );
      try {
        await expect(
          editPeriodDatesUseCase(userId, current.id, {
            startDate: '2024-05-05',
            endDate: '2024-05-28',
          })
        ).rejects.toThrow();
        expect(await BudgetPeriodsRepository.findByUser(userId)).toEqual(before);
      } finally {
        await db.execute(sql`DROP TRIGGER fail_period_update ON budget_periods`);
        await db.execute(sql`DROP FUNCTION fail_period_update()`);
      }
    }
  );

  it('commits all three neighboring periods together', async () => {
    const { current } = await createTimeline();
    const result = await editPeriodDatesUseCase(userId, current.id, {
      startDate: '2024-05-05',
      endDate: '2024-05-28',
    });
    expect(result.previousPeriod?.end_date).toBe('2024-05-04');
    expect(result.period.start_date).toBe('2024-05-05');
    expect(result.period.end_date).toBe('2024-05-28');
    expect(result.nextPeriod?.start_date).toBe('2024-05-29');
    expect(result.period.budgets_snapshot).toEqual([foodBudget()]);
    expect(result.nextPeriod?.snapshot_at).toBeNull();
  });

  it('keeps neighboring periods continuous after concurrent edits from either side', async () => {
    const { current, next } = await createTimeline();
    const update = BudgetPeriodsRepository.update.bind(BudgetPeriodsRepository);
    vi.spyOn(BudgetPeriodsRepository, 'update').mockImplementation(async (...args) => {
      await delay(25);
      return update(...args);
    });
    await Promise.all([
      editPeriodDatesUseCase(userId, current.id, { endDate: '2024-05-28' }),
      editPeriodDatesUseCase(userId, next.id, { startDate: '2024-05-20' }),
    ]);
    const left = await BudgetPeriodsRepository.findById(current.id);
    const right = await BudgetPeriodsRepository.findById(next.id);
    expect(
      new Date(`${right?.start_date}T00:00:00Z`).getTime() -
        new Date(`${left?.end_date}T00:00:00Z`).getTime()
    ).toBe(86400000);
    expect(left?.budgets_snapshot).toEqual([foodBudget()]);
  });

  it('coordinates starting a new period with closing the old one', async () => {
    vi.spyOn(UsersRepository, 'findById').mockResolvedValue({
      id: userId,
      group_id: groupId,
    } as Awaited<ReturnType<typeof UsersRepository.findById>>);
    const active = await BudgetPeriodsRepository.create({
      user_id: userId,
      group_id: groupId,
      start_date: '2024-05-01',
      end_date: null,
      is_active: true,
    });
    const results = await Promise.allSettled([
      closeBudgetPeriodUseCase(userId, active.id, '2024-05-31'),
      createBudgetPeriodUseCase(userId, '2024-06-01'),
    ]);
    expect(results[1]?.status).toBe('fulfilled');
    const saved = await BudgetPeriodsRepository.findByUser(userId);
    expect(saved).toHaveLength(2);
    expect(saved.filter((period) => period.is_active)).toHaveLength(1);
    expect(saved.find((period) => period.id === active.id)?.end_date).toBe('2024-05-31');
    expect(saved.find((period) => period.is_active)?.start_date).toBe('2024-06-01');
  });
});

describe('complete period totals independently of report windows', () => {
  it('keeps budget remaining unchanged when only the custom report range changes', async () => {
    const period = await BudgetPeriodsRepository.create({
      user_id: userId,
      group_id: groupId,
      start_date: '2024-05-01',
      end_date: '2024-05-24',
      is_active: false,
      budgets_snapshot: [foodBudget()],
      spendable_spent: '0',
      snapshot_at: new Date('2024-06-01'),
    });
    for (const [date, amount] of [
      ['2024-05-05', '40'],
      ['2024-05-22', '10'],
    ]) {
      await TransactionsRepository.create({
        description: 'Food',
        amount: amount!,
        type: 'expense',
        category: 'food',
        date: date!,
        account_id: a,
        group_id: groupId,
        user_id: userId,
      });
    }
    const accounts = (await AccountsRepository.findByGroup(groupId)).map((account) => ({
      ...account,
      balance: Number(account.balance),
    }));
    const viewer = { id: userId, role: 'admin', group_id: groupId } as User;
    vi.mocked(getReportsContextUseCase).mockResolvedValue({
      accounts,
      periods: [period],
      categories: [],
      users: [viewer] as Awaited<ReturnType<typeof getReportsContextUseCase>>['users'],
      budgets: [foodBudget({ amount: 999 })],
    });
    const first = await getReportsPageDataUseCase(groupId, [userId], viewer, {
      preset: 'custom',
      customStart: '2024-05-20',
      customEnd: '2024-05-25',
    });
    const second = await getReportsPageDataUseCase(groupId, [userId], viewer, {
      preset: 'custom',
      customStart: '2024-05-21',
      customEnd: '2024-05-25',
    });
    expect(first.sections.all.expenses).toBe(10);
    expect(first.periods[0]).toMatchObject({ allocated: 100, spendableSpent: 50, remaining: 50 });
    expect(second.periods).toEqual(first.periods);
  });

  it('loads the whole period across month boundaries', async () => {
    const period = await BudgetPeriodsRepository.create({
      user_id: userId,
      group_id: groupId,
      start_date: '2024-04-20',
      end_date: '2024-05-10',
      is_active: false,
      budgets_snapshot: [foodBudget()],
    });
    for (const date of ['2024-04-25', '2024-05-05'])
      await TransactionsRepository.create({
        description: 'Food',
        amount: '25',
        type: 'expense',
        category: 'food',
        date,
        account_id: a,
        group_id: groupId,
        user_id: userId,
      });
    const summaries = await getReportsPeriodSummariesUseCase(
      groupId,
      [period],
      await AccountsRepository.findByGroup(groupId),
      [],
      { start: new Date('2024-05-07'), end: new Date('2024-05-08') }
    );
    expect(summaries[0]).toMatchObject({ allocated: 100, spendableSpent: 50, remaining: 50 });
  });

  it('ignores the 5,000-row display limit when calculating a budget period', async () => {
    const period = await BudgetPeriodsRepository.create({
      user_id: userId,
      group_id: groupId,
      start_date: '2024-05-01',
      end_date: '2024-05-31',
      is_active: false,
      budgets_snapshot: [foodBudget({ amount: 10000 })],
    });
    await db.execute(sql`INSERT INTO transactions (description, amount, type, category, date, account_id, user_id, group_id)
      SELECT 'Food', 1, 'expense', 'food', DATE '2024-05-10', ${a}::uuid, ${userId}::uuid, ${groupId}::uuid FROM generate_series(1, 5001)`);
    const window = { start: new Date('2024-05-01'), end: new Date('2024-05-31T23:59:59Z') };
    expect(
      (
        await getReportsTransactionsUseCase(groupId, {
          startDate: window.start,
          endDate: window.end,
        })
      ).hasMore
    ).toBe(true);
    const summaries = await getReportsPeriodSummariesUseCase(
      groupId,
      [period],
      await AccountsRepository.findByGroup(groupId),
      [],
      window
    );
    expect(summaries[0]).toMatchObject({ spendableSpent: 5001, remaining: 4999 });
  });
});

describe('preferences persistence against PostgreSQL', () => {
  it('lazily creates and updates only the validated preferences for the target user', async () => {
    const saved = await updateUserPreferencesUseCase(userId, {
      language: 'en',
      currency: 'USD',
      timezone: 'Europe/London',
      notifications_push: false,
    });
    expect(saved).toMatchObject({
      user_id: userId,
      language: 'en-US',
      currency: 'USD',
      notifications_push: false,
    });
    expect(await UserPreferencesRepository.getByUserId(userId)).toMatchObject(saved);
  });
  it('does not create or reassign preferences from forged ownership input', async () => {
    await expect(
      updateUserPreferencesUseCase(userId, { user_id: b, currency: 'USD' })
    ).rejects.toThrow();
    expect(await UserPreferencesRepository.getByUserId(userId)).toBeNull();
    expect(await UserPreferencesRepository.getByUserId(b)).toBeNull();
  });
});

function gate() {
  return Promise.withResolvers<void>();
}

async function seedRecalculationLedger() {
  await AccountsRepository.update(a, { balance: '0' });
  await AccountsRepository.update(b, { balance: '0' });
  for (const accountId of [a, b]) {
    await createTransactionUseCase({
      description: 'Opening ledger income',
      amount: 1000,
      type: 'income',
      category: 'salary',
      date: '2026-10-01',
      account_id: accountId,
      user_id: userId,
      group_id: groupId,
    });
  }
}

async function expectBalancesMatchLedger() {
  for (const accountId of [a, b]) {
    const rows = await TransactionsRepository.getByAccount(accountId);
    expect(Number((await AccountsRepository.findById(accountId))?.balance)).toBe(
      sumAccountBalanceFromRows(accountId, rows)
    );
  }
}

describe('balance recalculation coordinated with ledger mutations', () => {
  it.each(['income', 'expense', 'transfer-out', 'transfer-in', 'edit', 'delete'] as const)(
    'keeps the ledger consistent when recalculation precedes %s',
    async (operation) => {
      await seedRecalculationLedger();
      const movement = await createTransactionUseCase({
        description: 'Movement',
        amount: 10,
        type: 'transfer',
        category: 'transfer',
        date: '2026-10-02',
        account_id: a,
        to_account_id: b,
        user_id: userId,
        group_id: groupId,
      });
      const accountId = operation === 'transfer-in' ? b : a;
      const read = gate();
      const resume = gate();
      const getByAccount = TransactionsRepository.getByAccount.bind(TransactionsRepository);
      const spy = vi
        .spyOn(TransactionsRepository, 'getByAccount')
        .mockImplementationOnce(async (...args) => {
          const rows = await getByAccount(...args);
          read.resolve();
          await resume.promise;
          return rows;
        });
      const recalculation = recalculateAccountBalanceUseCase(accountId);
      await read.promise;
      const mutation =
        operation === 'edit'
          ? updateTransactionUseCase(movement.id, { amount: 25 }, { groupId })
          : operation === 'delete'
            ? deleteTransactionUseCase(movement.id, { groupId })
            : createTransactionUseCase({
                description: 'Concurrent movement',
                amount: 30,
                type:
                  operation === 'income'
                    ? 'income'
                    : operation === 'expense'
                      ? 'expense'
                      : 'transfer',
                category: 'food',
                date: '2026-10-03',
                account_id: a,
                to_account_id: operation.startsWith('transfer') ? b : null,
                user_id: userId,
                group_id: groupId,
              });
      try {
        // The writer must reach PostgreSQL and wait on our account row lock.
        // Without the lock it commits and this assertion fails before we release the read.
        await vi.waitFor(async () => {
          const [row] = await db.execute(sql`SELECT count(*)::int AS waiting FROM pg_stat_activity
            WHERE datname = current_database() AND wait_event_type = 'Lock'
            AND query LIKE 'UPDATE accounts SET balance%'`);
          expect(row?.waiting).toBeGreaterThan(0);
        });
      } finally {
        resume.resolve();
        await Promise.all([recalculation, mutation]);
        spy.mockRestore();
      }
      await expectBalancesMatchLedger();
    }
  );

  it('reads the committed ledger after waiting for an earlier writer', async () => {
    await seedRecalculationLedger();
    const updated = gate();
    const resume = gate();
    const update = TransactionsRepository.updateAccountBalance.bind(TransactionsRepository);
    const writerSpy = vi
      .spyOn(TransactionsRepository, 'updateAccountBalance')
      .mockImplementationOnce(async (...args) => {
        await update(...args);
        updated.resolve();
        await resume.promise;
      });
    const mutation = createTransactionUseCase({
      description: 'Concurrent expense',
      amount: 30,
      type: 'expense',
      category: 'food',
      date: '2026-10-03',
      account_id: a,
      user_id: userId,
      group_id: groupId,
    });
    await updated.promise;
    const recalculation = recalculateAccountBalanceUseCase(a);
    try {
      await vi.waitFor(async () => {
        const [row] = await db.execute(sql`SELECT count(*)::int AS waiting FROM pg_stat_activity
          WHERE datname = current_database() AND wait_event_type = 'Lock'
          AND query LIKE '%accounts%for update%'`);
        expect(row?.waiting).toBeGreaterThan(0);
      });
    } finally {
      resume.resolve();
      await Promise.all([mutation, recalculation]);
      writerSpy.mockRestore();
    }
    await expectBalancesMatchLedger();
  });

  it('rolls back and does not invalidate caches if ledger loading fails', async () => {
    const spy = vi
      .spyOn(TransactionsRepository, 'getByAccount')
      .mockRejectedValueOnce(new Error('unavailable'));
    try {
      await expect(recalculateAccountBalanceUseCase(a)).rejects.toThrow('unavailable');
      expect(Number((await AccountsRepository.findById(a))?.balance)).toBe(800);
      expect(invalidateAccountCaches).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});
