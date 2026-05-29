import { DateTime } from 'luxon';
import type { BudgetPeriod } from '@/lib/types';
import { toDateTime } from '@/lib/utils/date-utils';

export interface EffectivePeriod {
  start: DateTime;
  end: DateTime;
  activePeriod: BudgetPeriod | null;
  isSynthetic: boolean;
}

/**
 * Resolves the date range used for budget calculations.
 * When no active period exists, synthesizes the current calendar month (matches tx fetch window).
 */
export function resolveEffectivePeriod(
  activePeriod: BudgetPeriod | null | undefined,
  now: Date = new Date()
): EffectivePeriod {
  if (activePeriod?.start_date) {
    const start = toDateTime(activePeriod.start_date);
    if (!start) {
      return calendarMonthPeriod(now);
    }
    const end = activePeriod.end_date
      ? (toDateTime(activePeriod.end_date)?.endOf('day') ?? DateTime.fromJSDate(now).endOf('day'))
      : DateTime.fromJSDate(now).endOf('day');
    return { start: start.startOf('day'), end, activePeriod, isSynthetic: false };
  }
  return calendarMonthPeriod(now);
}

function calendarMonthPeriod(now: Date): EffectivePeriod {
  const start = DateTime.fromJSDate(new Date(now.getFullYear(), now.getMonth(), 1)).startOf('day');
  const end = DateTime.fromJSDate(
    new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  ).endOf('day');
  return { start, end, activePeriod: null, isSynthetic: true };
}

/** Returns [periodStart, periodEnd] for budget transaction filtering. */
export function parsePeriodDates(
  activePeriod: BudgetPeriod | null | undefined,
  now?: Date
): [DateTime, DateTime] {
  const effective = resolveEffectivePeriod(activePeriod, now);
  return [effective.start, effective.end];
}

/**
 * Resolves the chart X-axis end date (may extend beyond "today" for open periods).
 * Open active period: at least 30 days from start, or today if the period is longer.
 * Closed period: actual end_date. No period: end of current calendar month.
 */
export function resolveChartPeriodEnd(
  activePeriod: BudgetPeriod | null | undefined,
  now: Date = new Date()
): DateTime {
  const effective = resolveEffectivePeriod(activePeriod, now);

  if (activePeriod?.start_date && activePeriod.is_active && !activePeriod.end_date) {
    const minEnd = effective.start.plus({ days: 30 }).endOf('day');
    const todayEnd = DateTime.fromJSDate(now).endOf('day');
    return minEnd > todayEnd ? minEnd : todayEnd;
  }

  return effective.end;
}
