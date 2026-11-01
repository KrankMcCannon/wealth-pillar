import { toDateTime } from '@/lib/utils/date-utils';
import type { DateInput } from '@/lib/utils/date-utils';
import { financialDateTime } from './financial-date';

export type TransactionDateRangePreset = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export function resolveTransactionDateRangeBounds(
  preset: TransactionDateRangePreset | undefined,
  custom?: { startDate?: string; endDate?: string },
  now: Date = new Date()
): { startDate?: Date; endDate?: Date } {
  const date = financialDateTime(now);
  if (preset === 'custom') {
    return {
      ...(custom?.startDate
        ? { startDate: financialDateTime(custom.startDate).startOf('day').toJSDate() }
        : {}),
      ...(custom?.endDate
        ? { endDate: financialDateTime(custom.endDate).endOf('day').toJSDate() }
        : {}),
    };
  }
  const days = { today: 0, week: 7, month: 30, year: 365 };
  if (!preset || !(preset in days)) return {};
  return {
    startDate: date
      .minus({ days: days[preset as keyof typeof days] })
      .startOf('day')
      .toJSDate(),
    endDate: date.endOf('day').toJSDate(),
  };
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
