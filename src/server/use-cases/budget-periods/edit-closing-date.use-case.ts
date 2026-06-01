import type { BudgetPeriod } from '@/lib/types';
import { toDateTime, todayDateString } from '@/lib/utils/date-utils';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { getTransactionsByUserUseCase } from '../transactions/get-transactions.use-case';
import {
  computePeriodLiquidityAmounts,
  periodToDateWindow,
  snapshotFieldsFromAmounts,
} from './period-amounts.logic';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/config';
import { invalidateBudgetPeriodCaches } from '@/lib/utils/cache-utils';

export class EditClosingDateError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'EditClosingDateError';
  }
}

function toDateOnlyString(date: string | Date): string {
  if (typeof date === 'string') {
    return date.split('T')[0] ?? date;
  }
  return date.toISOString().split('T')[0] ?? '';
}

export function findLatestClosedPeriod(
  periods: BudgetPeriod[],
  active: BudgetPeriod | null
): BudgetPeriod | null {
  if (!active?.start_date) return null;

  const activeStartStr = toDateOnlyString(active.start_date);

  return (
    periods.find((period) => {
      if (period.is_active || !period.end_date) return false;

      const endDt = toDateTime(toDateOnlyString(period.end_date));
      if (!endDt) return false;

      return endDt.plus({ days: 1 }).toISODate() === activeStartStr;
    }) ?? null
  );
}

export interface EditClosingDateResult {
  closedPeriod: BudgetPeriod;
  activePeriod: BudgetPeriod;
}

export const editBudgetPeriodClosingDateUseCase = async (
  userId: string,
  periodId: string,
  newEndDate: string | Date
): Promise<EditClosingDateResult> => {
  const endDt = toDateTime(newEndDate);
  if (!endDt) throw new EditClosingDateError('invalidDate');

  const period = await BudgetPeriodsRepository.findById(periodId);
  if (!period || period.user_id !== userId) {
    throw new EditClosingDateError('periodNotFound');
  }

  if (period.is_active) {
    throw new EditClosingDateError('periodMustBeClosed');
  }

  const periods = await BudgetPeriodsRepository.findByUser(userId);
  const active = periods.find((p) => p.is_active) ?? null;
  if (!active) {
    throw new EditClosingDateError('noActivePeriod');
  }

  const latestClosed = findLatestClosedPeriod(periods, active);
  if (!latestClosed || latestClosed.id !== periodId) {
    throw new EditClosingDateError('notLatestPeriod');
  }

  const startDt = toDateTime(period.start_date);
  if (!startDt || endDt < startDt) {
    throw new EditClosingDateError('endBeforeStart');
  }

  const newEndStr = endDt.toISODate();
  if (!newEndStr) throw new EditClosingDateError('invalidDate');

  const newActiveStartStr = endDt.plus({ days: 1 }).toISODate();
  if (!newActiveStartStr) throw new EditClosingDateError('invalidDate');

  const today = todayDateString();
  if (newActiveStartStr > today) {
    throw new EditClosingDateError('futureActiveStart');
  }

  const [transactions, accounts] = await Promise.all([
    getTransactionsByUserUseCase(userId),
    AccountsRepository.findByUser(userId),
  ]);

  const closingPeriod: BudgetPeriod = {
    ...period,
    end_date: newEndStr,
    is_active: false,
  };
  const window = periodToDateWindow(closingPeriod);
  const amounts = computePeriodLiquidityAmounts(transactions, accounts, window, userId);

  const closedPeriod = await BudgetPeriodsRepository.update(periodId, {
    end_date: newEndStr,
    ...snapshotFieldsFromAmounts(amounts),
  });

  const activePeriod = await BudgetPeriodsRepository.update(active.id, {
    start_date: newActiveStartStr,
  });

  revalidateTag(CACHE_TAGS.USER_PREFERENCE(userId), 'max');
  invalidateBudgetPeriodCaches({ userId });

  return { closedPeriod, activePeriod };
};

export const getLatestClosedBudgetPeriodUseCase = async (
  userId: string
): Promise<BudgetPeriod | null> => {
  const periods = await BudgetPeriodsRepository.findByUser(userId);
  const active = periods.find((p) => p.is_active) ?? null;
  return findLatestClosedPeriod(periods, active);
};
