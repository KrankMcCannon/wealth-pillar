import { describe, it, expect } from 'vitest';
import { computePeriodLiquidityAmounts, resolvePeriodAmounts } from './period-amounts.logic';
import type { Account, BudgetPeriod, Transaction } from '@/lib/types';

const window = {
  start: new Date('2024-06-01'),
  end: new Date('2024-06-30T23:59:59'),
};

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: 'a1',
    name: 'Payroll',
    type: 'payroll',
    liquidity: 'spendable',
    user_ids: ['u1'],
    group_id: 'g1',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    description: '',
    amount: 100,
    type: 'expense',
    category: 'food',
    date: '2024-06-10',
    user_id: 'u1',
    account_id: 'a1',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function period(overrides: Partial<BudgetPeriod> = {}): BudgetPeriod {
  return {
    id: 'p1',
    user_id: 'u1',
    start_date: '2024-06-01',
    end_date: '2024-06-30',
    is_active: false,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('computePeriodLiquidityAmounts', () => {
  const accounts = [
    account({ id: 'a1', type: 'payroll', liquidity: 'spendable' }),
    account({ id: 'a2', type: 'savings', liquidity: 'reserve' }),
  ];

  it('sums expenses on spendable accounts only', () => {
    const result = computePeriodLiquidityAmounts(
      [
        tx({ amount: 50, account_id: 'a1' }),
        tx({ amount: 200, account_id: 'a2' }),
        tx({ amount: 30, type: 'income', account_id: 'a1' }),
      ],
      accounts,
      window,
      'u1'
    );
    expect(result.spendableSpent).toBe(50);
    expect(result.categorySpending).toEqual({ food: 50 });
  });

  it('computes reserve_saved from spendable-to-reserve transfers', () => {
    const result = computePeriodLiquidityAmounts(
      [
        tx({
          type: 'transfer',
          amount: 75,
          account_id: 'a1',
          to_account_id: 'a2',
          category: 'savings',
        }),
      ],
      accounts,
      window,
      'u1'
    );
    expect(result.reserveSaved).toBe(75);
  });
});

describe('resolvePeriodAmounts', () => {
  const accounts = [account({ id: 'a1' })];

  it('returns snapshot when snapshot_at is set', () => {
    const frozen = period({
      snapshot_at: '2024-07-01',
      spendable_spent: 1200,
      reserve_saved: 300,
      category_spending: { food: 800, transport: 400 },
    });

    const result = resolvePeriodAmounts(frozen, [tx({ amount: 999 })], accounts);
    expect(result.spendableSpent).toBe(1200);
    expect(result.reserveSaved).toBe(300);
    expect(result.categorySpending).toEqual({ food: 800, transport: 400 });
  });

  it('computes live when no snapshot', () => {
    const active = period({ is_active: true, end_date: null, snapshot_at: null });
    const result = resolvePeriodAmounts(
      active,
      [tx({ amount: 42 })],
      accounts,
      new Date('2024-06-15')
    );
    expect(result.spendableSpent).toBe(42);
  });
});
