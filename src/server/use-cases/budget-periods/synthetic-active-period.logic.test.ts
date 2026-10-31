import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BudgetPeriod, User } from '@/lib/types';
import { addSyntheticActivePeriod } from './synthetic-active-period.logic';
import { todayDateString } from '@/lib/utils/date-utils';

const user = { id: 'u1', budget_start_date: null } as User;
afterEach(() => vi.useRealTimers());
describe('calendar dates in Europe/Rome', () => {
  it.each([
    ['2026-10-30T23:30:00Z', '2026-10-31'],
    ['2026-07-14T22:30:00Z', '2026-07-15'],
  ])('keeps the local day at %s', (instant, date) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(instant));
    expect(todayDateString()).toBe(date);
    const periods: BudgetPeriod[] = [];
    addSyntheticActivePeriod(user, periods);
    expect(periods[0]?.start_date).toBe(date);
  });
  it('advances calendar days across the daylight saving boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-26T12:00:00Z'));
    const periods = [{ id: 'previous', end_date: '2026-10-25' }] as BudgetPeriod[];
    addSyntheticActivePeriod(user, periods);
    expect(periods[1]?.start_date).toBe('2026-10-26');
  });
  it('clamps a day-31 budget to the last day of February', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-28T23:30:00Z'));
    const periods: BudgetPeriod[] = [];
    addSyntheticActivePeriod({ ...user, budget_start_date: 31 }, periods);
    expect(periods[0]?.start_date).toBe('2026-02-28');
  });
});
