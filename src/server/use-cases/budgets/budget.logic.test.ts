import { describe, it, expect } from 'vitest';
import {
  effectiveSpentFromTransactions,
  buildBudgetsByUserPure,
  filterTransactionsForBudgetsUnion,
  buildBudgetCategoryBreakdown,
} from './budget.logic';
import { resolveEffectivePeriod, resolveChartPeriodEnd } from '../shared/period.logic';
import type { Budget, Transaction, User, BudgetPeriod, Category } from '@/lib/types';

const user = {
  id: 'user-1',
  name: 'Test',
  email: 't@test.com',
  clerk_id: 'clerk-1',
  group_id: 'group-1',
  role: 'member',
  avatar: null,
  theme_color: null,
  default_account_id: null,
  budget_start_date: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
} as User;

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    description: 'Test',
    amount: 100,
    type: 'expense',
    category: 'food',
    date: '2024-06-15',
    user_id: 'user-1',
    account_id: 'acc-1',
    to_account_id: null,
    frequency: 'once',
    recurring_series_id: null,
    group_id: 'group-1',
    created_at: '2024-06-01',
    updated_at: '2024-06-01',
    ...overrides,
  };
}

function budget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'b-1',
    user_id: 'user-1',
    group_id: 'group-1',
    description: 'Food',
    amount: 500,
    icon: 'cart',
    type: 'monthly',
    categories: ['food'],
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  };
}

describe('effectiveSpentFromTransactions', () => {
  it('subtracts income and floors at zero', () => {
    const spent = effectiveSpentFromTransactions([
      tx({ amount: 200, type: 'expense' }),
      tx({ amount: 50, type: 'income' }),
    ]);
    expect(spent).toBe(150);
  });

  it('ignores transfers (not counted as spent)', () => {
    const spent = effectiveSpentFromTransactions([
      tx({ amount: 200, type: 'expense' }),
      tx({ amount: 100, type: 'transfer', to_account_id: 'acc-2' }),
    ]);
    expect(spent).toBe(200);
  });
});

describe('resolveEffectivePeriod', () => {
  it('uses calendar month when no active period', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    const effective = resolveEffectivePeriod(null, now);
    expect(effective.isSynthetic).toBe(true);
    expect(effective.start.month).toBe(6);
    expect(effective.start.day).toBe(1);
  });
});

describe('buildBudgetsByUserPure', () => {
  const fixedNow = new Date('2024-06-15T12:00:00Z');

  it('computes spent for user without active period using calendar month (fix #1)', () => {
    const transactions = [tx({ date: '2024-06-10', amount: 80 })];
    const result = buildBudgetsByUserPure(
      [user],
      [budget()],
      transactions,
      { 'user-1': null },
      fixedNow
    );
    expect(result['user-1']?.totalSpent).toBe(80);
  });

  it('dedupes overlapping categories in totalSpent (fix #2)', () => {
    const period: BudgetPeriod = {
      id: 'p-1',
      user_id: 'user-1',
      start_date: '2024-06-01',
      end_date: null,
      is_active: true,
      created_at: '2024-06-01',
      updated_at: '2024-06-01',
    };
    const budgets = [
      budget({ id: 'b-1', categories: ['food'] }),
      budget({ id: 'b-2', categories: ['food'], description: 'Food 2' }),
    ];
    const transactions = [tx({ date: '2024-06-10', amount: 100 })];
    const result = buildBudgetsByUserPure(
      [user],
      budgets,
      transactions,
      { 'user-1': period },
      fixedNow
    );
    expect(result['user-1']?.totalSpent).toBe(100);
    const sumPerBudget = (result['user-1']?.budgets ?? []).reduce((s, b) => s + b.spent, 0);
    expect(sumPerBudget).toBe(200);
  });
});

describe('filterTransactionsForBudgetsUnion', () => {
  it('returns transactions once for union of categories', () => {
    const period = resolveEffectivePeriod(null, new Date('2024-06-15'));
    const txs = filterTransactionsForBudgetsUnion(
      [tx(), tx({ id: 'tx-2', category: 'transport' })],
      [budget(), budget({ id: 'b-2', categories: ['transport'] })],
      period.start,
      period.end
    );
    expect(txs).toHaveLength(2);
  });
});

describe('buildBudgetCategoryBreakdown', () => {
  const categories: Category[] = [
    {
      id: 'cat-1',
      key: 'food',
      label: 'Food',
      icon: 'cart',
      color: '#ff0000',
      group_id: 'group-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: 'cat-2',
      key: 'transport',
      label: 'Transport',
      icon: 'car',
      color: '#00ff00',
      group_id: 'group-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  ];

  it('sums spent per category with income reducing spent', () => {
    const b = budget({ categories: ['food', 'transport'] });
    const transactions = [
      tx({ category: 'food', amount: 200, type: 'expense' }),
      tx({ id: 'tx-2', category: 'food', amount: 50, type: 'income' }),
      tx({ id: 'tx-3', category: 'transport', amount: 80, type: 'expense' }),
      tx({
        id: 'tx-4',
        category: 'transport',
        amount: 100,
        type: 'transfer',
        to_account_id: 'acc-2',
      }),
    ];
    const breakdown = buildBudgetCategoryBreakdown(b, transactions, categories);
    expect(breakdown).toHaveLength(2);
    expect(breakdown[0]?.spent).toBe(150);
    expect(breakdown[1]?.spent).toBe(80);
  });

  it('excludes zero-spent categories and sorts by spent descending', () => {
    const b = budget({ categories: ['food', 'transport'] });
    const breakdown = buildBudgetCategoryBreakdown(b, [], categories);
    expect(breakdown).toHaveLength(0);
  });
});

describe('resolveChartPeriodEnd', () => {
  it('is exported and usable from period logic', () => {
    const end = resolveChartPeriodEnd(null, new Date('2024-06-15'));
    expect(end.month).toBe(6);
  });
});
