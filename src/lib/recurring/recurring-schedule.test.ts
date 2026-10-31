import { afterEach, describe, expect, it, vi } from 'vitest';
import { DateTime } from 'luxon';
import type { RecurringTransactionSeries } from '@/lib/types';
import { getRecurringSchedule } from './recurring-schedule';
import { calculateMonthlyAmount, calculateRecurringTotals } from './recurring-calculations';
import { validateRecurringDefinition } from './recurring-validation';
const base: RecurringTransactionSeries = {
  id: 's',
  description: 'Bill',
  amount: 120,
  type: 'expense',
  category: 'food',
  frequency: 'monthly',
  due_day: 31,
  start_date: '2024-01-01',
  end_date: null,
  account_id: 'a',
  user_ids: ['u'],
  is_active: true,
  total_executions: 0,
  created_at: '',
  updated_at: '',
};
const at = (date: string) => DateTime.fromISO(date, { zone: 'Europe/Rome' });
afterEach(() => vi.useRealTimers());
describe('recurring calendar forecasts', () => {
  it('includes today and clamps a missing month day', () => {
    expect(getRecurringSchedule(base, at('2026-02-28'))).toMatchObject({
      nextDate: '2026-02-28',
      status: 'due',
      daysUntilDue: 0,
    });
  });
  it('keeps a 14 day interval anchored to the start weekday', () => {
    const series = {
      ...base,
      frequency: 'biweekly' as const,
      start_date: '2026-10-05',
      due_day: 1,
    };
    expect(getRecurringSchedule(series, at('2026-10-12')).nextDate).toBe('2026-10-19');
    expect(getRecurringSchedule(series, at('2026-10-19')).status).toBe('due');
  });
  it('includes a weekly due date today and respects a future start', () => {
    const series = { ...base, frequency: 'weekly' as const, due_day: 6 };
    expect(getRecurringSchedule(series, at('2026-10-31')).nextDate).toBe('2026-10-31');
    expect(
      getRecurringSchedule({ ...series, start_date: '2026-11-10' }, at('2026-10-31')).nextDate
    ).toBe('2026-11-14');
  });
  it('does not propose an occurrence before the start or after the end', () => {
    expect(
      getRecurringSchedule({ ...base, start_date: '2026-12-10', due_day: 5 }, at('2026-10-31'))
        .nextDate
    ).toBe('2027-01-05');
    expect(
      getRecurringSchedule({ ...base, end_date: '2026-10-30' }, at('2026-10-31'))
    ).toMatchObject({ nextDate: null, status: 'ended' });
  });
  it('handles a February 29 yearly series in a non-leap year', () => {
    expect(
      getRecurringSchedule(
        { ...base, frequency: 'yearly', due_day: 29, start_date: '2024-02-29' },
        at('2026-02-28')
      ).nextDate
    ).toBe('2026-02-28');
  });
  it('distinguishes a recorded occurrence from a forecast using ledger dates', () => {
    expect(
      getRecurringSchedule({ ...base, recorded_dates: ['2026-10-31'] }, at('2026-10-31'))
    ).toMatchObject({ status: 'recorded', nextDate: '2026-11-30' });
    expect(getRecurringSchedule({ ...base, total_executions: 100 }, at('2026-10-31')).status).toBe(
      'due'
    );
  });
  it('keeps a one-off due until recorded, then ends it', () => {
    const once = { ...base, frequency: 'once' as const, start_date: '2026-10-20' };
    expect(getRecurringSchedule(once, at('2026-10-31'))).toMatchObject({
      nextDate: '2026-10-20',
      status: 'due',
    });
    expect(
      getRecurringSchedule({ ...once, recorded_dates: ['2026-10-20'] }, at('2026-10-31')).status
    ).toBe('ended');
    expect(calculateMonthlyAmount(once)).toBe(0);
  });
  it('excludes ended and not-yet-started commitments from the current monthly equivalent', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-31T12:00:00Z'));
    expect(
      calculateRecurringTotals([
        base,
        { ...base, id: 'future', start_date: '2026-12-01' },
        { ...base, id: 'ended', end_date: '2026-10-01' },
      ]).totalExpenses
    ).toBe(120);
  });
  it('flags unsupported or invalid legacy definitions without inventing a date', () => {
    expect(validateRecurringDefinition({ ...base, type: 'transfer' })).toBeTruthy();
    expect(
      getRecurringSchedule({ ...base, frequency: 'weekly', due_day: 31 }, at('2026-10-31'))
    ).toMatchObject({ nextDate: null, status: 'invalid' });
    expect(validateRecurringDefinition({ ...base, due_day: 1.5 })).toBeTruthy();
  });
});
