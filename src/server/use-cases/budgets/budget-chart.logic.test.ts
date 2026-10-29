import { describe, it, expect } from 'vitest';
import { buildBudgetChartViewModel } from './budget-chart.logic';
import type { Budget, Transaction } from '@/lib/types';
import { today as luxonToday } from '@/lib/utils/date-utils';

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    description: 'Test',
    amount: 100,
    type: 'expense',
    category: 'food',
    date: '2024-06-05',
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

describe('buildBudgetChartViewModel', () => {
  it('builds chart with extended window and future points beyond today', () => {
    const today = luxonToday();
    const periodStart = today.minus({ days: 5 }).startOf('day');
    const chartPeriodEnd = periodStart.plus({ days: 30 }).endOf('day');
    const txDate = today.minus({ days: 2 }).toISODate() ?? '';
    const transactions = [tx({ date: txDate, amount: 50 })];

    const vm = buildBudgetChartViewModel(
      transactions,
      [budget()],
      'user-1',
      periodStart,
      chartPeriodEnd,
      null
    );

    expect(vm.chartData).not.toBeNull();
    expect(vm.chartData!.length).toBeGreaterThanOrEqual(30);
    const futurePoints = vm.chartData!.filter((p) => p.isFuture);
    expect(futurePoints.length).toBeGreaterThan(0);
    const visiblePoints = vm.chartData!.filter((p) => !p.isFuture);
    expect(visiblePoints.at(-1)?.amount).toBe(50);
  });

  it('returns empty chart when no budgets', () => {
    const today = luxonToday();
    const periodStart = today.startOf('day');
    const chartPeriodEnd = today.plus({ days: 30 }).endOf('day');
    const vm = buildBudgetChartViewModel([], [], 'user-1', periodStart, chartPeriodEnd, null);
    expect(vm.chartData).toBeNull();
    expect(vm.chartAggregateSpent).toBe(0);
  });
});
