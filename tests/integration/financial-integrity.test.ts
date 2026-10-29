import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/drizzle';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { deleteAccountUseCase } from '@/server/use-cases/accounts/account.use-cases';
import { recalculateClosedPeriodSnapshotUseCase } from '@/server/use-cases/budget-periods/recalculate-closed-period.use-case';
import { invalidateAccountCaches, invalidateTransactionCaches } from '@/lib/utils/cache-utils';

vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), updateTag: vi.fn() }));
vi.mock('@/lib/utils/cache-utils', () => ({
  invalidateAccountCaches: vi.fn(),
  invalidateTransactionCaches: vi.fn(),
  invalidateBudgetPeriodCaches: vi.fn(),
}));

const groupId = '00000000-0000-4000-8000-000000000001';
const userId = '00000000-0000-4000-8000-000000000002';
const a = '00000000-0000-4000-8000-000000000003';
const b = '00000000-0000-4000-8000-000000000004';

beforeAll(async () => {
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
});

afterAll(async () => {
  await db.execute(sql`DROP TABLE IF EXISTS transactions, accounts, budget_periods CASCADE`);
  await db.execute(sql`DROP FUNCTION IF EXISTS fail_account_delete()`);
  await db.$client.end();
});

beforeEach(async () => {
  vi.clearAllMocks();
  await db.execute(sql`TRUNCATE accounts, transactions, budget_periods`);
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
