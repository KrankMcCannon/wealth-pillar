import { financialDateTime } from '@/lib/utils/financial-date';
import type { DateTime } from 'luxon';

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
    validDay(range.start) &&
    validDay(range.end) &&
    range.start <= range.end
  );
}

function validDay(value: string): boolean {
  try {
    return financialDateTime(value).toISODate() === value;
  } catch {
    return false;
  }
}

function window(start: DateTime, end: DateTime): DateWindow {
  return { start: start.startOf('day').toJSDate(), end: end.endOf('day').toJSDate() };
}

export function getCurrentReportingWindow(
  preset: ReportsTimePreset,
  custom: ReportsDateRange | null,
  now = new Date()
): DateWindow {
  const date = financialDateTime(now);
  if (preset === 'custom') {
    if (!isValidReportsRange(custom)) throw new Error('Invalid report date range');
    return window(financialDateTime(custom.start), financialDateTime(custom.end));
  }
  if (preset === 'last_year') {
    const previous = date.minus({ years: 1 });
    return window(previous.startOf('year'), previous.endOf('year'));
  }
  if (preset === 'last_month') {
    const previous = date.minus({ months: 1 });
    return window(previous.startOf('month'), previous.endOf('month'));
  }
  if (preset === 'weekly') return window(date.startOf('week'), date);
  if (preset === 'ytd') return window(date.startOf('year'), date);
  if (preset === 'yearly') return window(date.minus({ years: 1 }).plus({ days: 1 }), date);
  return window(date.startOf('month'), date);
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

/** Comparisons use Rome calendar arithmetic, including DST and leap years. */
export function getComparisonReportingWindow(
  preset: ReportsTimePreset,
  current: DateWindow,
  now = new Date()
): DateWindow | null {
  const date = financialDateTime(now);
  const start = financialDateTime(current.start).startOf('day');
  const end = financialDateTime(current.end).startOf('day');
  if (preset === 'custom') {
    const days = Math.round(end.diff(start, 'days').days) + 1;
    return days < 1 ? null : window(start.minus({ days }), start.minus({ days: 1 }));
  }
  if (preset === 'last_year') {
    const previous = start.minus({ years: 1 });
    return window(previous.startOf('year'), previous.endOf('year'));
  }
  if (preset === 'last_month') {
    const previous = start.minus({ months: 1 });
    return window(previous.startOf('month'), previous.endOf('month'));
  }
  if (preset === 'monthly') {
    const previous = date.minus({ months: 1 });
    return window(previous.startOf('month'), previous);
  }
  if (preset === 'weekly')
    return window(date.startOf('week').minus({ weeks: 1 }), date.minus({ weeks: 1 }));
  if (preset === 'ytd') {
    const previous = date.minus({ years: 1 });
    return window(previous.startOf('year'), previous);
  }
  if (preset === 'yearly') {
    const previousEnd = start.minus({ days: 1 });
    return window(previousEnd.minus({ years: 1 }).plus({ days: 1 }), previousEnd);
  }
  return null;
}
