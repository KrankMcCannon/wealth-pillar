import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { validSeriesValues, latestQuoteDate, buildSeriesIndex } from './market-data.types';
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-03T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());
it('discards empty, malformed, future and non-positive quotes without parseFloat coercion', () => {
  const invalid = [
    null,
    {},
    { datetime: '2026-02-30', close: 1 },
    { datetime: '2026-11-04', close: 1 },
    ...['12garbage', 0, -1, 'Infinity', ''].map((close) => ({ datetime: '2026-11-02', close })),
  ];
  expect(validSeriesValues(invalid)).toEqual([]);
  expect(latestQuoteDate(invalid)).toBeNull();
  expect(buildSeriesIndex([{ symbol: 'AAA', data: invalid as never }])).toEqual({});
  expect(validSeriesValues(undefined)).toEqual([]);
});
it('reports the latest actual quote date instead of the fetch time', () => {
  const values = [
    { time: '2026-10-30', close: '12.5' },
    { datetime: '2026-11-02', close: 13 },
  ];
  expect(latestQuoteDate(values)).toBe('2026-11-02');
  expect(validSeriesValues(values)[0]).toMatchObject({ datetime: '2026-10-30', close: '12.5' });
});
