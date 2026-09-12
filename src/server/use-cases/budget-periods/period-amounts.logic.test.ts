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

  it('uses envelope budget legs including savings transfers', () => {
    const result = computePeriodLiquidityAmounts(
      [
        tx({ amount: 50, account_id: 'a1' }),
        tx({
          id: 'save',
          amount: 40,
          type: 'transfer',
          category: 'savings',
          account_id: 'a1',
          to_account_id: 'a2',
        }),
        tx({ amount: 30, type: 'income', account_id: 'a1' }),
      ],
      accounts,
      window,
      'u1',
      new Set(['food', 'savings'])
    );
    expect(result.spendableSpent).toBe(60);
    expect(result.categorySpending).toEqual({ food: 20, savings: 40 });
  });

  it('ignores movements whose category is not on an envelope', () => {
    const result = computePeriodLiquidityAmounts(
      [
        tx({ amount: 50 }),
        tx({
          id: 'save',
          amount: 40,
          type: 'transfer',
          category: 'savings',
          account_id: 'a1',
          to_account_id: 'a2',
        }),
      ],
      accounts,
      window,
      'u1',
      new Set(['food'])
    );
    expect(result.spendableSpent).toBe(50);
    expect(result.categorySpending).toEqual({ food: 50 });
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
    expect(result.categorySpending).toEqual({ food: 800, transport: 400 });
  });

  it('computes live when no snapshot', () => {
    const active = period({ is_active: true, end_date: null, snapshot_at: null });
    const result = resolvePeriodAmounts(
      active,
      [tx({ amount: 42 })],
      accounts,
      new Date('2024-06-15'),
      new Set(['food'])
    );
    expect(result.spendableSpent).toBe(42);
  });
});
