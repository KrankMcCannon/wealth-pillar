import type { BudgetPeriod } from '@/lib/types';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { getTransactionsByUserUseCase } from '../transactions/get-transactions.use-case';
import {
  computePeriodLiquidityAmounts,
  periodToDateWindow,
  snapshotFieldsFromAmounts,
} from './period-amounts.logic';
import { isSyntheticBudgetPeriodId } from './synthetic-active-period.logic';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/config';
import { invalidateBudgetPeriodCaches } from '@/lib/utils/cache-utils';

export class RecalculateClosedPeriodError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'RecalculateClosedPeriodError';
  }
}

export async function recalculateClosedPeriodSnapshotUseCase(
  userId: string,
  periodId: string
): Promise<BudgetPeriod> {
  if (isSyntheticBudgetPeriodId(periodId)) {
    throw new RecalculateClosedPeriodError('syntheticPeriod');
  }

  const period = await BudgetPeriodsRepository.findById(periodId);
  if (!period || period.user_id !== userId) {
    throw new RecalculateClosedPeriodError('periodNotFound');
  }

  const [transactions, accounts] = await Promise.all([
    getTransactionsByUserUseCase(userId),
    AccountsRepository.findByUser(userId),
  ]);

  const window = periodToDateWindow(period);
  const amounts = computePeriodLiquidityAmounts(transactions, accounts, window, userId);
  const updated = await BudgetPeriodsRepository.update(
    periodId,
    snapshotFieldsFromAmounts(amounts)
  );

  revalidateTag(CACHE_TAGS.USER_PREFERENCE(userId), 'max');
  invalidateBudgetPeriodCaches({ userId, periodId });
  if (period.group_id) {
    revalidateTag(`group:${period.group_id}:budgets`, 'max');
    revalidateTag(`group:${period.group_id}:transactions`, 'max');
  }

  return updated;
}
