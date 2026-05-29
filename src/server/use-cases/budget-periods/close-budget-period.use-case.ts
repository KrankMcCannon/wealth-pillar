import type { BudgetPeriod } from '@/lib/types';
import { toDateTime } from '@/lib/utils/date-utils';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { createBudgetPeriodUseCase } from './create-budget-period.use-case';
import { DateTime } from 'luxon';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/config';
import { getTransactionsByUserUseCase } from '../transactions/get-transactions.use-case';
import {
  computePeriodLiquidityAmounts,
  periodToDateWindow,
  snapshotFieldsFromAmounts,
} from './period-amounts.logic';

const autoCreateNextPeriod = async (userId: string, endDt: DateTime): Promise<void> => {
  const nextStartDt = endDt.plus({ days: 1 });
  const nextStartDateStr = nextStartDt.toISODate();

  if (nextStartDateStr) {
    try {
      await createBudgetPeriodUseCase(userId, nextStartDateStr);
    } catch (createError) {
      console.error('[BudgetPeriodService] Failed to auto-create next period:', createError);
    }
  }
};

export const closeBudgetPeriodUseCase = async (
  userId: string,
  periodId: string,
  endDate: string | Date
): Promise<BudgetPeriod | null> => {
  const endDt = toDateTime(endDate);
  if (!endDt) throw new Error('Invalid end date format');

  const period = await BudgetPeriodsRepository.findById(periodId);
  if (!period || period.user_id !== userId) {
    throw new Error('Period not found');
  }

  const startDt = toDateTime(period.start_date);
  if (!startDt || endDt < startDt) {
    throw new Error('End date must be on or after start date');
  }

  const endDateStr = endDt.toISODate() as string;

  const [transactions, accounts] = await Promise.all([
    getTransactionsByUserUseCase(userId),
    AccountsRepository.findByUser(userId),
  ]);

  const closingPeriod: BudgetPeriod = {
    ...period,
    end_date: endDateStr,
    is_active: false,
  };
  const window = periodToDateWindow(closingPeriod);
  const amounts = computePeriodLiquidityAmounts(transactions, accounts, window, userId);

  const closedPeriod = await BudgetPeriodsRepository.update(periodId, {
    end_date: endDateStr,
    is_active: false,
    ...snapshotFieldsFromAmounts(amounts),
  });

  revalidateTag(CACHE_TAGS.USER_PREFERENCE(userId), 'max');

  await autoCreateNextPeriod(userId, endDt);

  return closedPeriod;
};
