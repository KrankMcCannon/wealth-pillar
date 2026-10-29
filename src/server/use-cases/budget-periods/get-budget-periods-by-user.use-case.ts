import { cached } from '@/lib/cache';
import { cacheOptions } from '@/lib/cache/config';
import { budgetPeriodCacheKeys } from '@/lib/cache/keys';
import type { BudgetPeriod } from '@/lib/types';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';

export const getBudgetsPeriodsByUserUseCase = async (userId: string): Promise<BudgetPeriod[]> => {
  const getCachedPeriods = cached(
    async () => {
      return BudgetPeriodsRepository.findByUser(userId);
    },
    budgetPeriodCacheKeys.byUser(userId),
    cacheOptions.budgetPeriodsByUser(userId)
  );

  const periods = await getCachedPeriods();
  return periods || [];
};
