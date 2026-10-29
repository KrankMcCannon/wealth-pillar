import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setTimeout as delay } from 'node:timers/promises';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/drizzle';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { deleteAccountUseCase } from '@/server/use-cases/accounts/account.use-cases';
import { recalculateClosedPeriodSnapshotUseCase } from '@/server/use-cases/budget-periods/recalculate-closed-period.use-case';
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

vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), updateTag: vi.fn() }));
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
});

afterAll(async () => {
  await db.execute(sql`DROP TABLE IF EXISTS transactions, accounts, budget_periods CASCADE`);
  await db.execute(sql`DROP FUNCTION IF EXISTS fail_account_delete()`);
  await db.$client.end();
});

beforeEach(async () => {
  vi.clearAllMocks();
  vi.stubEnv('CLERK_SECRET_KEY', 'local-integration-test-key');
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
