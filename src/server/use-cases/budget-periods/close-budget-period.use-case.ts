import type { BudgetPeriod } from '@/lib/types';
import { toDateTime } from '@/lib/utils/date-utils';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/config';
import { invalidateBudgetPeriodCaches } from '@/lib/utils/cache-utils';
import { getBudgetsByUserUseCase } from '../budgets/get-budgets.use-case';
import {
  computePeriodLiquidityAmounts,
  periodToDateWindow,
  snapshotFieldsFromAmounts,
} from './period-amounts.logic';
import { loadPeriodLiquidityData } from './load-period-liquidity-data';
import { categoryKeysFromBudgets, toBudgetsSnapshot } from './period-budgets.logic';

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

  const [liquidity, budgets] = await Promise.all([
    loadPeriodLiquidityData(period.group_id, userId),
    getBudgetsByUserUseCase(userId),
  ]);
  const { transactions, accounts } = liquidity;

  const closingPeriod: BudgetPeriod = {
    ...period,
    end_date: endDateStr,
    is_active: false,
  };
  const window = periodToDateWindow(closingPeriod);
  const amounts = computePeriodLiquidityAmounts(
    transactions,
    accounts,
    window,
    userId,
    categoryKeysFromBudgets(budgets),
    budgets
  );

  const closedPeriod = await BudgetPeriodsRepository.update(periodId, {
    end_date: endDateStr,
    is_active: false,
    ...snapshotFieldsFromAmounts(amounts),
    budgets_snapshot: toBudgetsSnapshot(budgets),
  });

  revalidateTag(CACHE_TAGS.USER_PREFERENCE(userId), 'max');
  invalidateBudgetPeriodCaches({ userId, periodId });

  return closedPeriod;
};
