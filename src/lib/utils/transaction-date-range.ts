import { toDateTime } from '@/lib/utils/date-utils';
import type { DateInput } from '@/lib/utils/date-utils';

export type TransactionDateRangePreset = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function resolveTransactionDateRangeBounds(
  preset: TransactionDateRangePreset | undefined,
  custom?: { startDate?: string; endDate?: string },
  now: Date = new Date()
): { startDate?: Date; endDate?: Date } {
  switch (preset) {
    case 'today':
      return { startDate: startOfDay(now), endDate: endOfDay(now) };
    case 'week': {
      const start = startOfDay(now);
      start.setDate(start.getDate() - 7);
      return { startDate: start, endDate: endOfDay(now) };
    }
    case 'month': {
      const start = startOfDay(now);
      start.setDate(start.getDate() - 30);
      return { startDate: start, endDate: endOfDay(now) };
    }
    case 'year': {
      const start = startOfDay(now);
      start.setDate(start.getDate() - 365);
      return { startDate: start, endDate: endOfDay(now) };
    }
    case 'custom': {
      const customStartDate = parseDate(custom?.startDate);
      const customEndDate = parseDate(custom?.endDate);
      return {
        ...(customStartDate ? { startDate: customStartDate } : {}),
        ...(customEndDate ? { endDate: customEndDate } : {}),
      };
    }
    default:
      return {};
  }
}

export function isTransactionDateInFilterRange(
  date: DateInput,
  preset: TransactionDateRangePreset,
  custom?: { startDate?: string | null; endDate?: string | null },
  now: Date = new Date()
): boolean {
  if (preset === 'all') return true;

  const transactionDate = toDateTime(date);
  if (!transactionDate) return false;

  const { startDate, endDate } = resolveTransactionDateRangeBounds(
    preset,
    {
      ...(custom?.startDate ? { startDate: custom.startDate } : {}),
      ...(custom?.endDate ? { endDate: custom.endDate } : {}),
    },
    now
  );

  if (startDate) {
    const start = toDateTime(startDate);
    if (start && transactionDate < start.startOf('day')) return false;
  }
  if (endDate) {
    const end = toDateTime(endDate);
    if (end && transactionDate > end.endOf('day')) return false;
  }

  return true;
}
