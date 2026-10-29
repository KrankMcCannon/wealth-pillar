import { describe, it, expect } from 'vitest';
import {
  isTransactionDateInFilterRange,
  resolveTransactionDateRangeBounds,
} from './transaction-date-range';

describe('resolveTransactionDateRangeBounds', () => {
  const now = new Date('2024-06-15T12:00:00.000Z');

  it('returns empty bounds for all', () => {
    expect(resolveTransactionDateRangeBounds('all', undefined, now)).toEqual({});
  });

  it('returns same-day bounds for today', () => {
    const { startDate, endDate } = resolveTransactionDateRangeBounds('today', undefined, now);
    expect(startDate?.getHours()).toBe(0);
    expect(endDate?.getHours()).toBe(23);
  });

  it('returns rolling week bounds', () => {
    const { startDate, endDate } = resolveTransactionDateRangeBounds('week', undefined, now);
    expect(startDate).toBeDefined();
    expect(endDate).toBeDefined();
    const diffDays =
      Math.round(((endDate!.getTime() - startDate!.getTime()) / (1000 * 60 * 60 * 24)) * 10) / 10;
    expect(diffDays).toBeGreaterThanOrEqual(7);
  });
});

describe('isTransactionDateInFilterRange', () => {
  const now = new Date('2024-06-15T12:00:00.000Z');

  it('matches server and client week preset consistently', () => {
    const { startDate } = resolveTransactionDateRangeBounds('week', undefined, now);
    expect(isTransactionDateInFilterRange(startDate, 'week', undefined, now)).toBe(true);
    expect(isTransactionDateInFilterRange('2020-01-01', 'week', undefined, now)).toBe(false);
  });

  it('respects custom range', () => {
    expect(
      isTransactionDateInFilterRange('2024-06-10', 'custom', {
        startDate: '2024-06-01',
        endDate: '2024-06-30',
      })
    ).toBe(true);
    expect(
      isTransactionDateInFilterRange('2024-07-01', 'custom', {
        startDate: '2024-06-01',
        endDate: '2024-06-30',
      })
    ).toBe(false);
  });
});
