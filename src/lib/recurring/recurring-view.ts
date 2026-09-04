import type { RecurringTransactionSeries } from '@/lib/types';
import { calculateDaysUntilDue, calculateRecurringTotals } from './recurring-calculations';

/** Active series due within this many days (including overdue) go in Upcoming. */
export const UPCOMING_WITHIN_DAYS = 7;

export type DecoratedRecurringSeries = RecurringTransactionSeries & {
  daysUntilDue: number;
};

export interface RecurringViewModel {
  filteredSeries: DecoratedRecurringSeries[];
  activeSeries: DecoratedRecurringSeries[];
  visibleSeriesCount: number;
  pausedCount: number;
  upcomingSeries: DecoratedRecurringSeries[];
  monthlySeries: DecoratedRecurringSeries[];
  yearlySeries: DecoratedRecurringSeries[];
  pausedSeries: DecoratedRecurringSeries[];
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
  const pausedSeries = filteredSeries.filter((item) => !item.is_active);
  const pausedCount = pausedSeries.length;
  const upcomingSeries = activeSeries.filter((item) => item.daysUntilDue <= UPCOMING_WITHIN_DAYS);
  const laterSeries = activeSeries.filter((item) => item.daysUntilDue > UPCOMING_WITHIN_DAYS);
  const yearlySeries = laterSeries.filter((item) => item.frequency === 'yearly');
  const monthlySeries = laterSeries.filter((item) => item.frequency !== 'yearly');

  const monthlyTotals = calculateRecurringTotals(activeSeries);

  return {
    filteredSeries,
    activeSeries,
    visibleSeriesCount,
    pausedCount,
    upcomingSeries,
    monthlySeries,
    yearlySeries,
    pausedSeries,
    monthlyTotals,
    totalMonthlyRecurring: monthlyTotals.netMonthly,
  };
}
