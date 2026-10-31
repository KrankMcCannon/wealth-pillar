import { describe, it, expect } from 'vitest';
import { differenceInCalendarDays, format } from 'date-fns';
import {
  getCurrentReportingWindow,
  getComparisonReportingWindow,
  isValidReportsRange,
  resolveReportsPreset,
  unionReportingWindows,
  DEFAULT_REPORTS_PRESET,
} from './reporting-window';

describe('report comparison boundaries', () => {
  const now = new Date(2026, 9, 30, 12);
  it.each([
    ['2026-10-10', '2026-10-12', '2026-10-07', '2026-10-09'],
    ['2026-10-25', '2026-10-25', '2026-10-24', '2026-10-24'],
    ['2026-03-28', '2026-03-30', '2026-03-25', '2026-03-27'],
    ['2026-10-24', '2026-10-26', '2026-10-21', '2026-10-23'],
    ['2024-02-28', '2024-03-01', '2024-02-25', '2024-02-27'],
  ])(
    'compares %s–%s with the same inclusive calendar duration',
    (start, end, previousStart, previousEnd) => {
      const current = getCurrentReportingWindow('custom', { start, end }, now);
      const previous = getComparisonReportingWindow('custom', current, now)!;
      expect(format(previous.start, 'yyyy-MM-dd')).toBe(previousStart);
      expect(format(previous.end, 'yyyy-MM-dd')).toBe(previousEnd);
      expect(differenceInCalendarDays(previous.end, previous.start)).toBe(
        differenceInCalendarDays(current.end, current.start)
      );
    }
  );

  it.each([new Date(2026, 9, 30), new Date(2024, 1, 29), new Date(2025, 1, 28)])(
    'keeps rolling years contiguous and disjoint at %s',
    (date) => {
      const current = getCurrentReportingWindow('yearly', null, date);
      const previous = getComparisonReportingWindow('yearly', current, date)!;
      expect(current.start.getTime() - previous.end.getTime()).toBe(1);
      expect(current.end.getTime()).toBeGreaterThan(current.start.getTime());
    }
  );

  it.each([
    ['last_year', '2025-01-01', '2025-12-31', '2024-01-01', '2024-12-31'],
    ['last_month', '2026-09-01', '2026-09-30', '2026-08-01', '2026-08-31'],
  ] as const)(
    'uses completed calendar periods for %s',
    (preset, start, end, previousStart, previousEnd) => {
      const current = getCurrentReportingWindow(preset, null, now);
      const previous = getComparisonReportingWindow(preset, current, now)!;
      expect(
        [current.start, current.end, previous.start, previous.end].map((d) =>
          format(d, 'yyyy-MM-dd')
        )
      ).toEqual([start, end, previousStart, previousEnd]);
    }
  );

  it('rejects malformed, missing and reversed custom dates rather than showing a different period', () => {
    for (const range of [
      null,
      { start: '2026-02-30', end: '2026-03-01' },
      { start: '2026-10-12', end: '2026-10-10' },
    ]) {
      expect(isValidReportsRange(range)).toBe(false);
      expect(() => getCurrentReportingWindow('custom', range, now)).toThrow();
    }
  });
});

describe('unionReportingWindows', () => {
  it('uses current when comparison is null', () => {
    const current = { start: new Date('2024-06-01'), end: new Date('2024-06-30') };
    expect(unionReportingWindows(current, null)).toEqual(current);
  });

  it('spans the earlier start and later end', () => {
    const current = { start: new Date('2024-06-01'), end: new Date('2024-06-30') };
    const comparison = { start: new Date('2024-05-01'), end: new Date('2024-05-31') };
    const union = unionReportingWindows(current, comparison);
    expect(union.start).toEqual(comparison.start);
    expect(union.end).toEqual(current.end);
  });
});

describe('resolveReportsPreset', () => {
  it('defaults to yearly when preset is missing', () => {
    expect(resolveReportsPreset()).toBe(DEFAULT_REPORTS_PRESET);
    expect(resolveReportsPreset(undefined)).toBe('yearly');
  });

  it('falls back to yearly for invalid preset values', () => {
    expect(resolveReportsPreset('invalid')).toBe('yearly');
  });

  it('preserves valid preset values', () => {
    expect(resolveReportsPreset('monthly')).toBe('monthly');
    expect(resolveReportsPreset('custom')).toBe('custom');
  });
});
