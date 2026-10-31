import type { BudgetPeriod, User } from '@/lib/types';
import { today, toDateTime, toDateString } from '@/lib/utils/date-utils';

export const SYNTHETIC_ACTIVE_PERIOD_PREFIX = 'active-generated-';

export function isSyntheticBudgetPeriodId(id: string): boolean {
  return id.startsWith(SYNTHETIC_ACTIVE_PERIOD_PREFIX);
}

/**
 * When no open period exists, append a synthetic active period for reporting/chart windows.
 */
export function addSyntheticActivePeriod(user: User, periods: BudgetPeriod[]): void {
  const currentDay = today();
  let startDateStr = toDateString(currentDay);

  if (periods.length > 0) {
    const sortedByEnd = [...periods].sort((a, b) => {
      const aEnd = a.end_date ? String(a.end_date) : '0000-00-00';
      const bEnd = b.end_date ? String(b.end_date) : '0000-00-00';
      return bEnd.localeCompare(aEnd);
    });

    const lastPeriod = sortedByEnd[0];
    if (lastPeriod?.end_date) {
      const lastEnd = toDateTime(lastPeriod.end_date);
      if (lastEnd) startDateStr = toDateString(lastEnd.plus({ days: 1 }));
    }
  } else if (user.budget_start_date) {
    const day = user.budget_start_date;
    let month = currentDay.startOf('month');
    let start = month.set({ day: Math.min(day, month.daysInMonth!) });
    if (start > currentDay) {
      month = month.minus({ months: 1 });
      start = month.set({ day: Math.min(day, month.daysInMonth!) });
    }
    startDateStr = toDateString(start);
  }

  if (startDateStr <= toDateString(currentDay)) {
    const nowIso = new Date().toISOString();
    periods.push({
      id: `${SYNTHETIC_ACTIVE_PERIOD_PREFIX}${user.id}`,
      start_date: startDateStr,
      end_date: null,
      is_active: true,
      user_id: user.id,
      created_at: nowIso,
      updated_at: nowIso,
    });
  }
}
