import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Account, BudgetPeriod, Transaction } from '@/lib/types';
import {
  RecalculateClosedPeriodError,
  recalculateClosedPeriodSnapshotUseCase,
} from './recalculate-closed-period.use-case';

vi.mock('@/server/repositories/budget-periods.repository', () => ({
  BudgetPeriodsRepository: {
    findById: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('./load-period-liquidity-data', () => ({
  loadPeriodLiquidityData: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/utils/cache-utils', () => ({
  invalidateBudgetPeriodCaches: vi.fn(),
}));

import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { loadPeriodLiquidityData } from './load-period-liquidity-data';

function closedPeriod(overrides: Partial<BudgetPeriod> = {}): BudgetPeriod {
  return {
    id: 'closed-1',
    user_id: 'u1',
    group_id: 'g1',
    start_date: '2024-05-01',
    end_date: '2024-05-31',
    is_active: false,
    spendable_spent: 10,
    reserve_saved: 0,
    category_spending: {},
    snapshot_at: '2024-05-31T12:00:00.000Z',
    budgets_snapshot: [
      {
        id: 'b-food',
        description: 'Food',
        amount: 200,
        type: 'monthly',
        icon: null,
        categories: ['food'],
        user_id: 'u1',
        group_id: 'g1',
        created_at: '',
        updated_at: '',
      },
    ],
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

const payroll: Account = {
  id: 'a-spend',
  name: 'Payroll',
  type: 'payroll',
  user_ids: ['u2'],
  group_id: 'g1',
  balance: 300,
  liquidity: 'spendable',
  created_at: '',
  updated_at: '',
};

const reserve: Account = {
  id: 'a-reserve',
  name: 'Savings',
  type: 'savings',
  user_ids: ['u1', 'u2'],
  group_id: 'g1',
  balance: 500,
  liquidity: 'reserve',
  created_at: '',
  updated_at: '',
};

function expenseTx(): Transaction {
  return {
    id: 't1',
    description: '',
    amount: 40,
    type: 'expense',
    category: 'food',
    date: '2024-05-10',
    user_id: 'u1',
    account_id: 'a-spend',
    to_account_id: null,
    frequency: 'once',
    recurring_series_id: null,
    group_id: 'g1',
    created_at: '',
    updated_at: '',
  };
}

describe('recalculateClosedPeriodSnapshotUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadPeriodLiquidityData).mockResolvedValue({
      transactions: [],
      accounts: [payroll],
    });
  });

  it('rewrites snapshot fields from the current period window', async () => {
    const closed = closedPeriod();
    const updated = closedPeriod({ spendable_spent: 40, snapshot_at: '2024-06-01T00:00:00.000Z' });
    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(closed);
    vi.mocked(BudgetPeriodsRepository.update).mockResolvedValue(updated);
    vi.mocked(loadPeriodLiquidityData).mockResolvedValue({
      transactions: [expenseTx()],
      accounts: [payroll],
    });

    const result = await recalculateClosedPeriodSnapshotUseCase('u1', 'closed-1');

    expect(result.spendable_spent).toBe(40);
    expect(loadPeriodLiquidityData).toHaveBeenCalledWith('g1', 'u1');
    expect(BudgetPeriodsRepository.update).toHaveBeenCalledWith(
      'closed-1',
      expect.objectContaining({
        spendable_spent: '40',
        reserve_saved: null,
        category_spending: { food: 40 },
      })
    );
  });

  it('does not snapshot reserve from a partner dest-shared save', async () => {
    const closed = closedPeriod();
    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(closed);
    vi.mocked(BudgetPeriodsRepository.update).mockResolvedValue(closed);
    vi.mocked(loadPeriodLiquidityData).mockResolvedValue({
      transactions: [
        {
          ...expenseTx(),
          id: 'save',
          type: 'transfer',
          category: 'trasferimento',
          amount: 61,
          user_id: 'u2',
          account_id: 'a-spend',
          to_account_id: 'a-reserve',
        },
      ],
      accounts: [payroll, reserve],
    });

    await recalculateClosedPeriodSnapshotUseCase('u1', 'closed-1');

    expect(BudgetPeriodsRepository.update).toHaveBeenCalledWith(
      'closed-1',
      expect.objectContaining({ reserve_saved: null, spendable_spent: '0' })
    );
  });

  it('rewrites snapshot fields for an active period', async () => {
    const active = closedPeriod({ is_active: true, end_date: null, snapshot_at: null });
    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(active);
    vi.mocked(BudgetPeriodsRepository.update).mockResolvedValue(
      closedPeriod({ is_active: true, end_date: null, spendable_spent: 0 })
    );

    await recalculateClosedPeriodSnapshotUseCase('u1', 'closed-1');

    expect(BudgetPeriodsRepository.update).toHaveBeenCalledWith(
      'closed-1',
      expect.objectContaining({
        spendable_spent: '0',
        reserve_saved: null,
      })
    );
  });

  it('refuses a synthetic period id', async () => {
    await expect(
      recalculateClosedPeriodSnapshotUseCase('u1', 'active-generated-u1')
    ).rejects.toBeInstanceOf(RecalculateClosedPeriodError);
    expect(BudgetPeriodsRepository.findById).not.toHaveBeenCalled();
  });
});
