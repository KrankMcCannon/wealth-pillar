import { DateTime } from 'luxon';

export const FINANCIAL_TIME_ZONE = 'Europe/Rome';
export type FinancialDateInput = string | Date | DateTime;

/** An accounting day is a calendar date in Rome; timestamps remain UTC instants. */
export function financialDateTime(value: FinancialDateInput): DateTime {
  const date = DateTime.isDateTime(value)
    ? value.setZone(FINANCIAL_TIME_ZONE)
    : value instanceof Date
      ? DateTime.fromJSDate(value, { zone: FINANCIAL_TIME_ZONE })
      : DateTime.fromISO(value, { zone: FINANCIAL_TIME_ZONE });
  if (!date.isValid) throw new Error('Invalid financial date');
  return date;
}

export function financialDateKey(value: FinancialDateInput): string {
  return financialDateTime(value).toISODate()!;
}
