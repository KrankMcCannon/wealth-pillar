import { describe, it, expect } from 'vitest';
import {
  sumIncomeExpenseInWindow,
  computeGroupAccountTypeSummary,
  netFlowDeltaPercent,
  buildReportsSectionViewModel,
} from './report.logic';
import type { Account, Transaction } from '@/lib/types';

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
});
