/**
 * Pure recurring-series calculations shared by client UI and server use-cases.
 * Keep free of server/db imports so components never depend on `@/server/*`.
 */
import { DateTime } from 'luxon';
import type { RecurringTransactionSeries } from '@/lib/types';
import {
  toDateTime,
  today as luxonToday,
  diffInDays,
  toDateString,
  getDaysInMonth,
  toFiniteMoney,
} from '@/lib/utils';

function calculateWeekBasedNextDate(today: DateTime, dueDay: number, intervalDays: 7 | 14): string {
  const currentDayOfWeek = today.weekday;
  let daysUntilDue = dueDay - currentDayOfWeek;
  if (daysUntilDue <= 0) daysUntilDue += intervalDays;
  return toDateString(today.plus({ days: daysUntilDue }));
}

function calculateMonthlyNextDate(today: DateTime, dueDay: number): string {
  const currentDay = today.day;

  if (currentDay < dueDay) {
    const dayToUse = Math.min(dueDay, getDaysInMonth(today.year, today.month));
    return toDateString(today.set({ day: dayToUse }));
  }

  const nextMonth = today.plus({ months: 1 });
  const dayToUse = Math.min(dueDay, getDaysInMonth(nextMonth.year, nextMonth.month));
  return toDateString(nextMonth.set({ day: dayToUse }));
}

function calculateYearlyNextDate(today: DateTime, series: RecurringTransactionSeries): string {
  const startDate = toDateTime(series.start_date);
  if (!startDate) {
    return toDateString(today);
  }

  const startMonth = startDate.month;
  const dueDay = series.due_day;

  const thisYearBase = today.set({ month: startMonth });
  const dayToUseThisYear = Math.min(dueDay, getDaysInMonth(thisYearBase.year, thisYearBase.month));
  const thisYearDate = thisYearBase.set({ day: dayToUseThisYear });

  if (thisYearDate > today) {
    return toDateString(thisYearDate);
  }

  const nextYearBase = today.plus({ years: 1 }).set({ month: startMonth });
  const dayToUseNextYear = Math.min(dueDay, getDaysInMonth(nextYearBase.year, nextYearBase.month));
  return toDateString(nextYearBase.set({ day: dayToUseNextYear }));
}

function calculateOnceNextDate(today: DateTime, series: RecurringTransactionSeries): string {
  const startDate = toDateTime(series.start_date);
  if (!startDate) {
    return toDateString(today);
  }
  return startDate > today ? toDateString(startDate) : toDateString(today);
}

export function calculateNextExecutionDate(series: RecurringTransactionSeries): string {
  const today = luxonToday();

  switch (series.frequency) {
    case 'weekly':
      return calculateWeekBasedNextDate(today, series.due_day, 7);
    case 'biweekly':
      return calculateWeekBasedNextDate(today, series.due_day, 14);
    case 'monthly':
      return calculateMonthlyNextDate(today, series.due_day);
    case 'yearly':
      return calculateYearlyNextDate(today, series);
    default:
      return calculateOnceNextDate(today, series);
  }
}

export function calculateDaysUntilDue(series: RecurringTransactionSeries): number {
  const nextDate = toDateTime(calculateNextExecutionDate(series));
  const today = luxonToday();
  if (!nextDate) return 0;
  return diffInDays(today, nextDate);
}

export function isSeriesDue(series: RecurringTransactionSeries): boolean {
  if (!series.is_active) return false;

  const today = luxonToday();
  const nextExecution = toDateTime(calculateNextExecutionDate(series));
  if (!nextExecution) return false;

  return nextExecution <= today;
}

export function calculateMonthlyAmount(series: RecurringTransactionSeries): number {
  const amount = toFiniteMoney(series.amount);
  switch (series.frequency) {
    case 'weekly':
      return amount * 4.33;
    case 'biweekly':
      return amount * 2.17;
    case 'monthly':
      return amount;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

export function calculateRecurringTotals(series: RecurringTransactionSeries[]): {
  totalIncome: number;
  totalExpenses: number;
  netMonthly: number;
} {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const s of series) {
    if (!s.is_active) continue;

    const monthlyAmount = calculateMonthlyAmount(s);
    if (s.type === 'income') {
      totalIncome += monthlyAmount;
    } else if (s.type === 'expense') {
      totalExpenses += monthlyAmount;
    }
  }

  return {
    totalIncome,
    totalExpenses,
    netMonthly: totalIncome - totalExpenses,
  };
}
