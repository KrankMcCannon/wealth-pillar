import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfYear,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';

export type ReportsTimePreset =
  'monthly' | 'weekly' | 'ytd' | 'yearly' | 'custom' | 'last_year' | 'last_month';

export const REPORTS_PRESET_OPTIONS = [
  'yearly',
  'ytd',
  'monthly',
  'weekly',
  'custom',
  'last_year',
  'last_month',
] as const;

export const DEFAULT_REPORTS_PRESET: ReportsTimePreset = 'yearly';

export function resolveReportsPreset(raw?: string): ReportsTimePreset {
  if (raw && (REPORTS_PRESET_OPTIONS as readonly string[]).includes(raw)) {
    return raw as ReportsTimePreset;
  }
  return DEFAULT_REPORTS_PRESET;
}

export interface DateWindow {
  start: Date;
  end: Date;
}

export interface ReportsDateRange {
  start: string;
  end: string;
}

export function isValidReportsRange(range: ReportsDateRange | null): range is ReportsDateRange {
  return Boolean(
    range &&
    /^\d{4}-\d{2}-\d{2}$/.test(range.start) &&
    /^\d{4}-\d{2}-\d{2}$/.test(range.end) &&
    isValid(parseISO(range.start)) &&
    isValid(parseISO(range.end)) &&
    range.start <= range.end
  );
}

function startOfIsoWeek(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 });
}

/** Finestra corrente per preset (fine = oggi end-of-day, tranne custom). */
export function getCurrentReportingWindow(
  preset: ReportsTimePreset,
  custom: { start: string; end: string } | null,
  now = new Date()
): DateWindow {
  const end = endOfDay(now);

  if (preset === 'custom') {
    if (!isValidReportsRange(custom)) throw new Error('Invalid report date range');
    return { start: startOfDay(parseISO(custom.start)), end: endOfDay(parseISO(custom.end)) };
  }

  if (preset === 'last_year') {
    const previous = subYears(now, 1);
    return { start: startOfYear(previous), end: endOfYear(previous) };
  }

  if (preset === 'last_month') {
    const previous = subMonths(now, 1);
    return { start: startOfMonth(previous), end: endOfMonth(previous) };
  }

  if (preset === 'monthly') {
    return { start: startOfDay(startOfMonth(now)), end };
  }

  if (preset === 'weekly') {
    return { start: startOfDay(startOfIsoWeek(now)), end };
  }

  if (preset === 'ytd') {
    // Calendar fallback (1 Jan -> today). The page use-case refines the start to the
    // budget period that straddles 1 Jan when one exists.
    return { start: startOfDay(startOfYear(now)), end };
  }

  if (preset === 'yearly') {
    // Inclusive rolling year ending today, with no shared boundary day.
    return { start: startOfDay(addDays(subYears(now, 1), 1)), end };
  }

  return { start: startOfDay(startOfMonth(now)), end };
}

/** Inclusive union of current + comparison windows for a single date-bounded fetch. */
export function unionReportingWindows(
  current: DateWindow,
  comparison: DateWindow | null
): DateWindow {
  if (!comparison) return current;
  return {
    start: current.start < comparison.start ? current.start : comparison.start,
    end: current.end > comparison.end ? current.end : comparison.end,
  };
}

/**
 * Finestra precedente per confronto delta: stessa “forma” del preset.
 * - monthly: stesso giorno del mese nel mese precedente (finestra parziale se siamo a metà mese)
 * - weekly: stessi giorni dalla domenica della settimana precedente alla stessa distanza dalla fine settimana corrente
 * - ytd: 1 gen – stesso giorno/mese dell’anno precedente (fallback calendario; il use-case rifinisce)
 * - yearly: anno mobile precedente (oggi-2anni – oggi-1anno)
 * - custom: stessa durata immediatamente prima di `start`
 */
export function getComparisonReportingWindow(
  preset: ReportsTimePreset,
  current: DateWindow,
  now = new Date()
): DateWindow | null {
  if (preset === 'custom') {
    const days = differenceInCalendarDays(current.end, current.start) + 1;
    if (days < 1) return null;
    return {
      start: startOfDay(subDays(current.start, days)),
      end: endOfDay(subDays(current.start, 1)),
    };
  }

  if (preset === 'last_year') {
    const previous = subYears(current.start, 1);
    return { start: startOfYear(previous), end: endOfYear(previous) };
  }

  if (preset === 'last_month') {
    const previous = subMonths(current.start, 1);
    return { start: startOfMonth(previous), end: endOfMonth(previous) };
  }

  if (preset === 'monthly') {
    const ref = now;
    const dayInMonth = ref.getDate();
    const prevMonthAnchor = subMonths(ref, 1);
    const start = startOfDay(startOfMonth(prevMonthAnchor));
    const cap = endOfMonth(prevMonthAnchor);
    const target = new Date(
      prevMonthAnchor.getFullYear(),
      prevMonthAnchor.getMonth(),
      Math.min(dayInMonth, cap.getDate()),
      23,
      59,
      59,
      999
    );
    return { start, end: endOfDay(target) };
  }

  if (preset === 'weekly') {
    const thisWeekStart = startOfDay(startOfIsoWeek(now));
    const elapsedDays = Math.max(
      0,
      Math.floor((startOfDay(now).getTime() - thisWeekStart.getTime()) / 86400000)
    );
    const prevWeekStart = startOfDay(subWeeks(thisWeekStart, 1));
    const prevWeekEnd = endOfDay(addDays(prevWeekStart, elapsedDays));
    return { start: prevWeekStart, end: prevWeekEnd };
  }

  if (preset === 'ytd') {
    const y = now.getFullYear() - 1;
    const start = startOfDay(new Date(y, 0, 1));
    const end = endOfDay(new Date(y, now.getMonth(), now.getDate()));
    return { start, end };
  }

  if (preset === 'yearly') {
    const previousEnd = subDays(current.start, 1);
    return { start: startOfDay(addDays(subYears(previousEnd, 1), 1)), end: endOfDay(previousEnd) };
  }

  return null;
}
