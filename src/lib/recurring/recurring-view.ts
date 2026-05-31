import type { RecurringTransactionSeries } from '@/lib/types';
import {
  calculateDaysUntilDue,
  calculateMonthlyTotalAbs,
  calculateRecurringTotals,
} from './recurring-calculations';

export type DecoratedRecurringSeries = RecurringTransactionSeries & {
  daysUntilDue: number;
};

export interface RecurringViewModel {
  filteredSeries: DecoratedRecurringSeries[];
  activeSeries: DecoratedRecurringSeries[];
  visibleSeriesCount: number;
  pausedCount: number;
  upcomingSeries: DecoratedRecurringSeries[];
  monthlyTotals: {
    totalIncome: number;
    totalExpenses: number;
    netMonthly: number;
  };
  totalMonthlyRecurring: number;
}

export interface BuildRecurringViewOptions {
  selectedUserId?: string | undefined;
  maxItems?: number | undefined;
}

export function buildRecurringView(
  series: RecurringTransactionSeries[],
  options?: BuildRecurringViewOptions
): RecurringViewModel {
  const { selectedUserId, maxItems } = options ?? {};

  const visibleSeriesCount = selectedUserId
    ? series.filter((item) => item.user_ids.includes(selectedUserId)).length
    : series.length;

  const userFiltered = selectedUserId
    ? series.filter((item) => item.user_ids.includes(selectedUserId))
    : series;

  const decorated: DecoratedRecurringSeries[] = userFiltered.map((item) => ({
    ...item,
    daysUntilDue: calculateDaysUntilDue(item),
  }));

  decorated.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const filteredSeries = maxItems && maxItems > 0 ? decorated.slice(0, maxItems) : decorated;

  const activeSeries = filteredSeries.filter((item) => item.is_active);
  const pausedCount = filteredSeries.length - activeSeries.length;
  const upcomingSeries = filteredSeries.filter((item) => item.is_active && item.daysUntilDue >= 0);

  return {
    filteredSeries,
    activeSeries,
    visibleSeriesCount,
    pausedCount,
    upcomingSeries,
    monthlyTotals: calculateRecurringTotals(activeSeries),
    totalMonthlyRecurring: calculateMonthlyTotalAbs(activeSeries),
  };
}
