import { describe, expect, it } from 'vitest';
import { financialDateKey, financialDateTime } from './financial-date';
import { resolveTransactionDateRangeBounds } from './transaction-date-range';
import {
  getCurrentReportingWindow,
  getComparisonReportingWindow,
} from '@/features/reports/utils/reporting-window';

describe('Rome accounting dates independent of the process timezone', () => {
  it.each([
    ['2026-10-31T23:30:00Z', '2026-11-01'],
    ['2026-12-31T23:30:00Z', '2027-01-01'],
    ['2026-03-28T23:30:00Z', '2026-03-29'],
    ['2026-10-24T22:30:00Z', '2026-10-25'],
  ])('keeps ledger and report boundaries on the same day at %s', (instant, day) => {
    const now = new Date(instant);
    const ledger = resolveTransactionDateRangeBounds('today', undefined, now);
    const report = getCurrentReportingWindow('monthly', null, now);
    expect(financialDateKey(now)).toBe(day);
    expect(financialDateKey(ledger.startDate!)).toBe(day);
    expect(financialDateKey(ledger.endDate!)).toBe(day);
    expect(financialDateKey(report.start)).toBe(`${day.slice(0, 7)}-01`);
    expect(financialDateKey(report.end)).toBe(day);
  });

  it.each([
    ['2026-03-29', 23],
    ['2026-10-25', 25],
  ] as const)('uses the actual %s calendar day across DST', (day, hours) => {
    const date = financialDateTime(day);
    expect(date.plus({ days: 1 }).diff(date, 'hours').hours).toBe(hours);
    const current = getCurrentReportingWindow('custom', { start: day, end: day });
    const comparison = getComparisonReportingWindow('custom', current)!;
    expect(current.start.getTime() - comparison.end.getTime()).toBe(1);
  });

  it('clamps the previous year to February 28 without spilling into March', () => {
    const now = new Date('2024-02-29T12:00:00Z');
    const current = getCurrentReportingWindow('ytd', null, now);
    expect(financialDateKey(getComparisonReportingWindow('ytd', current, now)!.end)).toBe(
      '2023-02-28'
    );
  });

  it('preserves date-only values and rejects impossible calendar dates', () => {
    expect(financialDateKey('2026-11-01')).toBe('2026-11-01');
    expect(() => financialDateKey('2026-02-30')).toThrow();
  });
});
