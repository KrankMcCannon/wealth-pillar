import { describe, it, expect } from 'vitest';
import {
  sumIncomeExpenseInWindow,
  computeGroupAccountTypeSummary,
  netFlowDeltaPercent,
  buildReportsSectionViewModel,
  REPORTS_TOP_EXPENSES_LIMIT,
} from './report.logic';
import type { Account, Category, Transaction } from '@/lib/types';

const window = {
  start: new Date('2024-06-01'),
  end: new Date('2024-06-30T23:59:59'),
};

describe('sumIncomeExpenseInWindow', () => {
  it('sums income and expense in window only', () => {
    const txs = [
      {
        id: '1',
        description: '',
        amount: 1000,
        type: 'income' as const,
        category: 'salary',
        date: '2024-06-10',
        user_id: 'u1',
        account_id: 'a1',
        to_account_id: null,
        frequency: 'once' as const,
        recurring_series_id: null,
        group_id: 'g1',
        created_at: '',
        updated_at: '',
      },
      {
        id: '2',
        description: '',
        amount: 200,
        type: 'expense' as const,
        category: 'food',
        date: '2024-05-10',
        user_id: 'u1',
        account_id: 'a1',
        to_account_id: null,
        frequency: 'once' as const,
        recurring_series_id: null,
        group_id: 'g1',
        created_at: '',
        updated_at: '',
      },
    ];
    const { income, expenses } = sumIncomeExpenseInWindow(txs, window);
    expect(income).toBe(1000);
    expect(expenses).toBe(0);
  });

  it('includes a date-only last day and excludes the next calendar day', () => {
    const txs: Transaction[] = [
      {
        id: 'in',
        description: '',
        amount: 40,
        type: 'expense',
        category: 'food',
        date: '2024-06-30',
        user_id: 'u1',
        account_id: 'a1',
        to_account_id: null,
        frequency: 'once',
        recurring_series_id: null,
        group_id: 'g1',
        created_at: '',
        updated_at: '',
      },
      {
        id: 'out',
        description: '',
        amount: 99,
        type: 'expense',
        category: 'food',
        date: '2024-07-01',
        user_id: 'u1',
        account_id: 'a1',
        to_account_id: null,
        frequency: 'once',
        recurring_series_id: null,
        group_id: 'g1',
        created_at: '',
        updated_at: '',
      },
    ];
    const { expenses } = sumIncomeExpenseInWindow(txs, window);
    expect(expenses).toBe(40);
  });

  it('ignores transfers in income and expense totals', () => {
    const { income, expenses } = sumIncomeExpenseInWindow(
      [
        {
          id: 'tr',
          description: '',
          amount: 100,
          type: 'transfer',
          category: 'savings',
          date: '2024-06-10',
          user_id: 'u1',
          account_id: 'a1',
          to_account_id: 'a2',
          frequency: 'once',
          recurring_series_id: null,
          group_id: 'g1',
          created_at: '',
          updated_at: '',
        },
      ],
      window
    );
    expect(income).toBe(0);
    expect(expenses).toBe(0);
  });
});

describe('computeGroupAccountTypeSummary', () => {
  it('filters earned/spent by window while keeping balances', () => {
    const accounts: Account[] = [
      {
        id: 'a1',
        name: 'Cash',
        type: 'cash',
        user_ids: ['u1'],
        group_id: 'g1',
        balance: 500,
        created_at: '',
        updated_at: '',
      },
    ];
    const txs: Transaction[] = [
      {
        id: '1',
        description: '',
        amount: 50,
        type: 'expense',
        category: 'food',
        date: '2024-06-10',
        user_id: 'u1',
        account_id: 'a1',
        to_account_id: null,
        frequency: 'once',
        recurring_series_id: null,
        group_id: 'g1',
        created_at: '',
        updated_at: '',
      },
      {
        id: '2',
        description: '',
        amount: 999,
        type: 'expense',
        category: 'food',
        date: '2024-01-10',
        user_id: 'u1',
        account_id: 'a1',
        to_account_id: null,
        frequency: 'once',
        recurring_series_id: null,
        group_id: 'g1',
        created_at: '',
        updated_at: '',
      },
    ];
    const rows = computeGroupAccountTypeSummary(txs, accounts, ['u1'], window);
    expect(rows[0]?.totalSpent).toBe(50);
    expect(rows[0]?.totalBalance).toBe(500);
  });

  it('avoids double-counting shared accounts for multiple users', () => {
    const accounts: Account[] = [
      {
        id: 'shared-1',
        name: 'Shared Checking',
        type: 'payroll',
        user_ids: ['u1', 'u2'],
        group_id: 'g1',
        balance: 1000,
        created_at: '',
        updated_at: '',
      },
    ];
    const rows = computeGroupAccountTypeSummary([], accounts, ['u1', 'u2'], window);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.accountType).toBe('payroll');
    expect(rows[0]?.totalBalance).toBe(1000);
  });
});

describe('netFlowDeltaPercent', () => {
  it('returns null when both nets are zero', () => {
    expect(netFlowDeltaPercent(0, 0)).toBeNull();
  });
});

describe('buildReportsSectionViewModel', () => {
  it('includes spendable, reserve, and net savings', () => {
    const accounts: Account[] = [
      {
        id: 'a1',
        name: 'Payroll',
        type: 'payroll',
        user_ids: ['u1'],
        group_id: 'g1',
        balance: 300,
        created_at: '',
        updated_at: '',
      },
      {
        id: 'a2',
        name: 'Savings',
        type: 'savings',
        user_ids: ['u1'],
        group_id: 'g1',
        balance: 500,
        created_at: '',
        updated_at: '',
      },
    ];
    const txs: Transaction[] = [
      {
        id: 't1',
        description: '',
        amount: 100,
        type: 'transfer',
        category: 'savings',
        date: '2024-06-10',
        user_id: 'u1',
        account_id: 'a1',
        to_account_id: 'a2',
        frequency: 'once',
        recurring_series_id: null,
        group_id: 'g1',
        created_at: '',
        updated_at: '',
      },
    ];
    const vm = buildReportsSectionViewModel(txs, accounts, [], ['u1'], window, null, 'u1');
    expect(vm.totalSpendable).toBe(300);
    expect(vm.totalReserve).toBe(500);
    expect(vm.netSavings.net).toBe(100);
    expect(vm.netSavings.deposits).toBe(100);
  });

  it('caps top expenses at 8 with filter key and color, not UUID as key', () => {
    const accounts: Account[] = [
      {
        id: 'a1',
        name: 'Cash',
        type: 'cash',
        user_ids: ['u1'],
        group_id: 'g1',
        balance: 50,
        created_at: '',
        updated_at: '',
      },
    ];
    const categories: Category[] = Array.from({ length: 9 }, (_, i) => ({
      id: `uuid-cat-${i}`,
      key: `cat-${i}`,
      label: `Category ${i}`,
      icon: 'tag',
      color: `#00${i}${i}${i}${i}`,
      group_id: 'g1',
      created_at: '',
      updated_at: '',
    }));
    const txs: Transaction[] = [
      ...categories.map((cat, i) => ({
        id: `e-${i}`,
        description: '',
        amount: 90 - i * 10,
        type: 'expense' as const,
        category: cat.key,
        date: '2024-06-10',
        user_id: 'u1',
        account_id: 'a1',
        to_account_id: null,
        frequency: 'once' as const,
        recurring_series_id: null,
        group_id: 'g1',
        created_at: '',
        updated_at: '',
      })),
      {
        id: 'orphan',
        description: '',
        amount: 5,
        type: 'expense',
        category: 'unknown-key',
        date: '2024-06-11',
        user_id: 'u1',
        account_id: 'a1',
        to_account_id: null,
        frequency: 'once',
        recurring_series_id: null,
        group_id: 'g1',
        created_at: '',
        updated_at: '',
      },
    ];

    const vm = buildReportsSectionViewModel(txs, accounts, categories, ['u1'], window, null, 'u1');

    expect(vm.topExpenses).toHaveLength(REPORTS_TOP_EXPENSES_LIMIT);
    expect(vm.topExpenses.map((row) => row.total)).toEqual([90, 80, 70, 60, 50, 40, 30, 20]);
    expect(vm.topExpenses[0]).toMatchObject({
      id: 'uuid-cat-0',
      key: 'cat-0',
      name: 'Category 0',
      total: 90,
      color: '#000000',
    });
    expect(vm.topExpenses.every((row) => row.key.startsWith('cat-'))).toBe(true);
    expect(vm.topExpenses.some((row) => row.key.startsWith('uuid-'))).toBe(false);
  });

  it('uses tx.category as key when the category row is missing', () => {
    const accounts: Account[] = [
      {
        id: 'a1',
        name: 'Cash',
        type: 'cash',
        user_ids: ['u1'],
        group_id: 'g1',
        balance: 50,
        created_at: '',
        updated_at: '',
      },
    ];
    const txs: Transaction[] = [
      {
        id: 'orphan',
        description: '',
        amount: 12,
        type: 'expense',
        category: 'unknown-key',
        date: '2024-06-11',
        user_id: 'u1',
        account_id: 'a1',
        to_account_id: null,
        frequency: 'once',
        recurring_series_id: null,
        group_id: 'g1',
        created_at: '',
        updated_at: '',
      },
    ];

    const vm = buildReportsSectionViewModel(txs, accounts, [], ['u1'], window, null, 'u1');
    expect(vm.topExpenses).toEqual([
      {
        id: 'unknown-key',
        key: 'unknown-key',
        name: 'Unknown Key',
        total: 12,
        color: 'oklch(var(--color-muted-foreground))',
      },
    ]);
  });
});
