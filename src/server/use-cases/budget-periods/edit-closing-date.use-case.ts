import type { Account, BudgetPeriod, Transaction } from '@/lib/types';
import { toDateTime, todayDateString } from '@/lib/utils/date-utils';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { getTransactionsByUserUseCase } from '../transactions/get-transactions.use-case';
import {
  computePeriodLiquidityAmounts,
  periodToDateWindow,
  snapshotFieldsFromAmounts,
} from './period-amounts.logic';
import { findNextPeriod, findPreviousPeriod } from './rewind-closed-period.use-case';
import { isSyntheticBudgetPeriodId } from './synthetic-active-period.logic';
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

function shiftIsoDate(iso: string, days: number): string {
  const shifted = toDateTime(iso)?.plus({ days }).toISODate();
  if (!shifted) throw new EditClosingDateError('invalidDate');
  return shifted;
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

function snapshotPatch(
  period: BudgetPeriod,
  transactions: Transaction[],
  accounts: Account[]
) {
  const amounts = computePeriodLiquidityAmounts(
    transactions,
    accounts,
    periodToDateWindow(period),
    period.user_id
  );
  return snapshotFieldsFromAmounts(amounts);
}

export interface EditPeriodDatesInput {
  startDate?: string | Date | undefined;
  endDate?: string | Date | undefined;
}

export interface EditPeriodDatesResult {
  period: BudgetPeriod;
  previousPeriod: BudgetPeriod | null;
  nextPeriod: BudgetPeriod | null;
}

export async function editPeriodDatesUseCase(
  userId: string,
  periodId: string,
  input: EditPeriodDatesInput
): Promise<EditPeriodDatesResult> {
  if (isSyntheticBudgetPeriodId(periodId)) {
    throw new EditClosingDateError('syntheticPeriod');
  }

  const period = await BudgetPeriodsRepository.findById(periodId);
  if (!period || period.user_id !== userId) {
    throw new EditClosingDateError('periodNotFound');
  }

  const isOpen = period.is_active && period.end_date == null;
  if (isOpen && input.endDate != null) {
    throw new EditClosingDateError('cannotEditActiveEnd');
  }

  const currentStart = toDateOnlyString(period.start_date);
  const currentEnd = period.end_date ? toDateOnlyString(period.end_date) : null;
  const newStart = input.startDate != null ? toDateOnlyString(input.startDate) : currentStart;
  const newEnd = isOpen
    ? null
    : input.endDate != null
      ? toDateOnlyString(input.endDate)
      : currentEnd;

  if (!newStart || (!isOpen && !newEnd)) {
    throw new EditClosingDateError('invalidDate');
  }
  if (input.startDate != null && !toDateTime(newStart)) {
    throw new EditClosingDateError('invalidDate');
  }
  if (input.endDate != null && newEnd && !toDateTime(newEnd)) {
    throw new EditClosingDateError('invalidDate');
  }
  if (!isOpen && newEnd && newEnd < newStart) {
    throw new EditClosingDateError('endBeforeStart');
  }

  const today = todayDateString();
  if (isOpen && newStart > today) {
    throw new EditClosingDateError('futureActiveStart');
  }

  const startChanged = newStart !== currentStart;
  const endChanged = !isOpen && newEnd !== currentEnd;

  const periods = await BudgetPeriodsRepository.findByUser(userId);
  const previous = findPreviousPeriod(periods, period);
  const next = findNextPeriod(periods, period);

  let previousEnd: string | null = null;
  if (startChanged && previous) {
    previousEnd = shiftIsoDate(newStart, -1);
    if (previousEnd < toDateOnlyString(previous.start_date)) {
      throw new EditClosingDateError('neighborOutOfRange');
    }
  }

  let nextStart: string | null = null;
  if (endChanged && next && newEnd) {
    nextStart = shiftIsoDate(newEnd, 1);
    if (next.end_date && nextStart > toDateOnlyString(next.end_date)) {
      throw new EditClosingDateError('neighborOutOfRange');
    }
    if (next.is_active && nextStart > today) {
      throw new EditClosingDateError('futureActiveStart');
    }
  }

  const [transactions, accounts] = await Promise.all([
    getTransactionsByUserUseCase(userId),
    AccountsRepository.findByUser(userId),
  ]);

  const thisRow: BudgetPeriod = {
    ...period,
    start_date: newStart,
    end_date: newEnd,
  };
  const updatedPeriod = await BudgetPeriodsRepository.update(periodId, {
    start_date: newStart,
    end_date: newEnd,
    ...snapshotPatch(thisRow, transactions, accounts),
  });

  let previousPeriod: BudgetPeriod | null = null;
  if (previous && previousEnd) {
    const prevRow: BudgetPeriod = { ...previous, end_date: previousEnd };
    previousPeriod = await BudgetPeriodsRepository.update(previous.id, {
      end_date: previousEnd,
      ...snapshotPatch(prevRow, transactions, accounts),
    });
  }

  let nextPeriod: BudgetPeriod | null = null;
  if (next && nextStart) {
    const nextRow: BudgetPeriod = { ...next, start_date: nextStart };
    nextPeriod = await BudgetPeriodsRepository.update(next.id, {
      start_date: nextStart,
      ...snapshotPatch(nextRow, transactions, accounts),
    });
  }

  revalidateTag(CACHE_TAGS.USER_PREFERENCE(userId), 'max');
  invalidateBudgetPeriodCaches({ userId });

  return { period: updatedPeriod, previousPeriod, nextPeriod };
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
  const result = await editPeriodDatesUseCase(userId, periodId, { endDate: newEndDate });
  return {
    closedPeriod: result.period,
    activePeriod: result.nextPeriod ?? result.period,
  };
};

export const getLatestClosedBudgetPeriodUseCase = async (
  userId: string
): Promise<BudgetPeriod | null> => {
  const periods = await BudgetPeriodsRepository.findByUser(userId);
  const active = periods.find((p) => p.is_active) ?? null;
  return findLatestClosedPeriod(periods, active);
};
