import type { RecurringTransactionSeries } from '@/lib/types';
import { calculateNextExecutionDate, calculateDaysUntilDue } from '@/lib/recurring/recurring-calculations';
import { formatDaysUntil, formatDateShort } from '@/lib/utils';

export {
  calculateNextExecutionDate,
  calculateDaysUntilDue,
  isSeriesDue,
  calculateMonthlyAmount,
  calculateRecurringTotals,
} from '@/lib/recurring/recurring-calculations';

/**
 * Get frequency label in Italian
 */
export function getFrequencyLabel(frequency: RecurringTransactionSeries['frequency']): string {
  const labels: Record<RecurringTransactionSeries['frequency'], string> = {
    once: 'Una tantum',
    weekly: 'Settimanale',
    biweekly: 'Quindicinale',
    monthly: 'Mensile',
    yearly: 'Annuale',
  };
  return labels[frequency] || frequency;
}

/**
 * Format due date with relative time
 */
export function formatDueDate(series: RecurringTransactionSeries): string {
  const daysUntil = calculateDaysUntilDue(series);

  if (daysUntil <= 7) {
    return formatDaysUntil(calculateNextExecutionDate(series));
  }

  return formatDateShort(calculateNextExecutionDate(series));
}

/**
 * Group series by user for display
 */
export function groupSeriesByUser(
  series: RecurringTransactionSeries[],
  users: Array<{ id: string; name: string }>
): Record<string, { user: { id: string; name: string }; series: RecurringTransactionSeries[] }> {
  const grouped: Record<
    string,
    { user: { id: string; name: string }; series: RecurringTransactionSeries[] }
  > = {};

  for (const user of users) {
    const userSeries = series.filter((s) => s.user_ids.includes(user.id));
    if (userSeries.length > 0) {
      grouped[user.id] = {
        user,
        series: userSeries,
      };
    }
  }

  return grouped;
}

/**
 * Check if a user has access to a series
 */
export function hasRecurringAccess(series: RecurringTransactionSeries, userId: string): boolean {
  return series.user_ids.includes(userId);
}

/**
 * Get all users associated with a series
 */
export function getAssociatedUsers(
  series: RecurringTransactionSeries,
  allUsers: Array<{ id: string; name: string; theme_color?: string | undefined }>
): Array<{ id: string; name: string; theme_color?: string | undefined }> {
  return allUsers.filter((user) => series.user_ids.includes(user.id));
}
