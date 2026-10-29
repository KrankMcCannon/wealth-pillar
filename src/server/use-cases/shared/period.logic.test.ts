import { describe, it, expect } from 'vitest';
import { resolveChartPeriodEnd, resolveEffectivePeriod } from './period.logic';
import type { BudgetPeriod } from '@/lib/types';

describe('resolveChartPeriodEnd', () => {
  it('extends open active period to at least 30 days from start when today is earlier', () => {
    const now = new Date('2024-06-10T12:00:00Z');
    const period: BudgetPeriod = {
      id: 'p-1',
      user_id: 'user-1',
      start_date: '2024-06-01',
      end_date: null,
      is_active: true,
      created_at: '2024-06-01',
      updated_at: '2024-06-01',
    };
    const chartEnd = resolveChartPeriodEnd(period, now);
    expect(chartEnd.day).toBe(1);
    expect(chartEnd.month).toBe(7);
  });

  it('uses today when open period exceeds 30 days', () => {
    const now = new Date('2024-07-15T12:00:00Z');
    const period: BudgetPeriod = {
      id: 'p-1',
      user_id: 'user-1',
      start_date: '2024-06-01',
      end_date: null,
      is_active: true,
      created_at: '2024-06-01',
      updated_at: '2024-06-01',
    };
    const chartEnd = resolveChartPeriodEnd(period, now);
    expect(chartEnd.day).toBe(15);
    expect(chartEnd.month).toBe(7);
  });

  it('uses end_date for closed period', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    const period: BudgetPeriod = {
      id: 'p-1',
      user_id: 'user-1',
      start_date: '2024-06-01',
      end_date: '2024-06-20',
      is_active: false,
      created_at: '2024-06-01',
      updated_at: '2024-06-20',
    };
    const chartEnd = resolveChartPeriodEnd(period, now);
    expect(chartEnd.day).toBe(20);
    expect(chartEnd.month).toBe(6);
  });

  it('uses calendar month end when no active period', () => {
    const now = new Date('2024-06-15T12:00:00Z');
    const chartEnd = resolveChartPeriodEnd(null, now);
    const effective = resolveEffectivePeriod(null, now);
    expect(chartEnd.toISODate()).toBe(effective.end.toISODate());
    expect(effective.start.toISO()).toBe('2024-06-01T00:00:00.000+02:00');
    expect(effective.end.toISO()).toBe('2024-06-30T23:59:59.999+02:00');
  });
});

describe('calendar month boundaries', () => {
  it('uses the Rome calendar month when UTC is still in the previous month', () => {
    const effective = resolveEffectivePeriod(null, new Date('2024-06-30T22:30:00Z'));
    expect(effective.start.toISO()).toBe('2024-07-01T00:00:00.000+02:00');
    expect(effective.end.toISO()).toBe('2024-07-31T23:59:59.999+02:00');
  });
});
