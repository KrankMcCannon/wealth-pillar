import { DateTime } from 'luxon';
import type { RecurringTransactionSeries } from '@/lib/types';
import { validateRecurringDefinition } from './recurring-validation';
import { today, toDateTime } from '@/lib/utils/date-utils';

export type RecurringScheduleStatus =
  'paused' | 'invalid' | 'ended' | 'recorded' | 'due' | 'scheduled';

function calendarOccurrence(series: RecurringTransactionSeries, from: DateTime): DateTime | null {
  const start = toDateTime(series.start_date)?.startOf('day');
  if (!start) return null;
  const lower = from > start ? from : start;
  const due = series.due_day;
  if (!Number.isInteger(due) || due < 1 || due > 31) return null;
  if (series.frequency === 'once') return start >= from ? start : null;
  if (series.frequency === 'weekly' || series.frequency === 'biweekly') {
    if (due > 7) return null;
    const anchor = start.plus({ days: (due - start.weekday + 7) % 7 });
    const interval = series.frequency === 'weekly' ? 7 : 14;
    const elapsed = Math.max(0, lower.diff(anchor, 'days').days);
    return anchor.plus({ days: Math.ceil(elapsed / interval) * interval });
  }
  const inMonth = (month: DateTime) =>
    month.startOf('month').set({ day: Math.min(due, month.daysInMonth!) });
  if (series.frequency === 'monthly') {
    const candidate = inMonth(lower);
    return candidate >= lower ? candidate : inMonth(lower.plus({ months: 1 }));
  }
  if (series.frequency === 'yearly') {
    const candidate = inMonth(lower.set({ month: start.month, day: 1 }));
    return candidate >= lower ? candidate : inMonth(candidate.plus({ years: 1 }));
  }
  return null;
}

/** Forecast only. Recorded ledger dates distinguish a due occurrence from one already registered. */
export function getRecurringSchedule(series: RecurringTransactionSeries, reference = today()) {
  const day = reference.startOf('day');
  const end = toDateTime(series.end_date)?.startOf('day');
  const invalid = validateRecurringDefinition(series) !== null;
  const recorded = new Set(series.recorded_dates ?? []);
  const todayDate = day.toISODate()!;
  const todayOccurrence = calendarOccurrence(series, day)?.hasSame(day, 'day') ?? false;
  const recordedToday = todayOccurrence && recorded.has(todayDate);
  let next = calendarOccurrence(series, day);
  // A once-only item remains due until registered, even when its date is in the past.
  if (series.frequency === 'once') {
    const start = toDateTime(series.start_date)?.startOf('day');
    next = start && !recorded.has(start.toISODate()!) ? start : null;
  }
  while (next && recorded.has(next.toISODate()!)) {
    next = calendarOccurrence(series, next.plus({ days: 1 }));
  }
  if (invalid || (next && end && next > end)) next = null;
  const status: RecurringScheduleStatus = !series.is_active
    ? 'paused'
    : invalid
      ? 'invalid'
      : end && end < day
        ? 'ended'
        : recordedToday
          ? 'recorded'
          : !next
            ? 'ended'
            : next <= day
              ? 'due'
              : 'scheduled';
  return {
    status,
    nextDate: next?.toISODate() ?? null,
    daysUntilDue: next ? Math.round(next.diff(day, 'days').days) : Number.POSITIVE_INFINITY,
  };
}

export function isRecurringInCurrentWindow(series: RecurringTransactionSeries): boolean {
  const start = toDateTime(series.start_date);
  const end = toDateTime(series.end_date);
  const day = today();
  return (
    series.is_active &&
    !validateRecurringDefinition(series) &&
    !!start &&
    start.startOf('day') <= day &&
    (!end || end.startOf('day') >= day)
  );
}
