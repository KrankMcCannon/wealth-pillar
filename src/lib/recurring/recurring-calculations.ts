/** Calendar forecasting shared by server and client; no automatic ledger mutation. */
import type { RecurringTransactionSeries } from '@/lib/types';
import { toFiniteMoney } from '@/lib/utils';
import { getRecurringSchedule, isRecurringInCurrentWindow } from './recurring-schedule';

export function calculateNextExecutionDate(series: RecurringTransactionSeries): string | null {
  return getRecurringSchedule(series).nextDate;
}
export function calculateDaysUntilDue(series: RecurringTransactionSeries): number {
  return getRecurringSchedule(series).daysUntilDue;
}
export function isSeriesDue(series: RecurringTransactionSeries): boolean {
  return getRecurringSchedule(series).status === 'due';
}

export function calculateMonthlyAmount(series: RecurringTransactionSeries): number {
  const amount = toFiniteMoney(series.amount);
  switch (series.frequency) {
    case 'weekly':
      return amount * 4.33;
    case 'biweekly':
      return amount * 2.17;
    case 'monthly':
      return amount;
    case 'yearly':
      return amount / 12;
    default:
      return 0;
  }
}

export function calculateRecurringTotals(series: RecurringTransactionSeries[]): {
  totalIncome: number;
  totalExpenses: number;
  netMonthly: number;
} {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const s of series) {
    if (!isRecurringInCurrentWindow(s)) continue;

    const monthlyAmount = calculateMonthlyAmount(s);
    if (s.type === 'income') {
      totalIncome += monthlyAmount;
    } else if (s.type === 'expense') {
      totalExpenses += monthlyAmount;
    }
  }

  return {
    totalIncome,
    totalExpenses,
    netMonthly: totalIncome - totalExpenses,
  };
}
