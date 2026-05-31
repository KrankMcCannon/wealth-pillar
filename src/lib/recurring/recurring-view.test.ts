import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RecurringTransactionSeries } from '@/lib/types';
import { buildRecurringView } from './recurring-view';
import * as recurringCalculations from './recurring-calculations';

function createSeries(
  overrides: Partial<RecurringTransactionSeries> & Pick<RecurringTransactionSeries, 'id'>
): RecurringTransactionSeries {
  return {
    description: overrides.description ?? 'Test series',
    amount: overrides.amount ?? 100,
    type: overrides.type ?? 'expense',
    category: overrides.category ?? 'food',
    frequency: overrides.frequency ?? 'monthly',
    user_ids: overrides.user_ids ?? ['user-1'],
    account_id: overrides.account_id ?? 'account-1',
    start_date: overrides.start_date ?? '2024-01-01',
    end_date: overrides.end_date ?? null,
    due_day: overrides.due_day ?? 1,
    is_active: overrides.is_active ?? true,
    total_executions: overrides.total_executions ?? 0,
    created_at: overrides.created_at ?? '2024-01-01T00:00:00Z',
    updated_at: overrides.updated_at ?? '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('buildRecurringView', () => {
  beforeEach(() => {
    vi.spyOn(recurringCalculations, 'calculateDaysUntilDue').mockImplementation((series) => {
      const daysById: Record<string, number> = {
        upcoming: 3,
        due: 0,
        overdue: -2,
        paused: 5,
        'other-user': 1,
      };
      return daysById[series.id] ?? 10;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filters by selected user and decorates each series once', () => {
    const series = [
      createSeries({ id: 'upcoming', user_ids: ['user-1'] }),
      createSeries({ id: 'other-user', user_ids: ['user-2'] }),
    ];

    const view = buildRecurringView(series, { selectedUserId: 'user-1' });

    expect(view.visibleSeriesCount).toBe(1);
    expect(view.filteredSeries).toHaveLength(1);
    expect(view.filteredSeries[0]?.id).toBe('upcoming');
    expect(view.filteredSeries[0]?.daysUntilDue).toBe(3);
    expect(recurringCalculations.calculateDaysUntilDue).toHaveBeenCalledTimes(1);
  });

  it('sorts by daysUntilDue ascending and groups upcoming series', () => {
    const series = [
      createSeries({ id: 'upcoming' }),
      createSeries({ id: 'due' }),
      createSeries({ id: 'overdue' }),
      createSeries({ id: 'paused', is_active: false }),
    ];

    const view = buildRecurringView(series);

    expect(view.filteredSeries.map((item) => item.id)).toEqual([
      'overdue',
      'due',
      'upcoming',
      'paused',
    ]);
    expect(view.upcomingSeries.map((item) => item.id)).toEqual(['due', 'upcoming']);
    expect(view.pausedCount).toBe(1);
  });

  it('applies maxItems after sort', () => {
    const series = [
      createSeries({ id: 'overdue' }),
      createSeries({ id: 'due' }),
      createSeries({ id: 'upcoming' }),
    ];

    const view = buildRecurringView(series, { maxItems: 2 });

    expect(view.filteredSeries).toHaveLength(2);
    expect(view.filteredSeries.map((item) => item.id)).toEqual(['overdue', 'due']);
  });

  it('computes monthly totals from active series only', () => {
    const series = [
      createSeries({ id: 'upcoming', type: 'income', amount: 1200 }),
      createSeries({ id: 'paused', type: 'expense', amount: 600, is_active: false }),
    ];

    const view = buildRecurringView(series);

    expect(view.monthlyTotals.totalIncome).toBe(1200);
    expect(view.monthlyTotals.totalExpenses).toBe(0);
    expect(view.totalMonthlyRecurring).toBe(1200);
  });
});
