import { cached } from '@/lib/cache';
import { cacheOptions } from '@/lib/cache/config';
import { budgetPeriodCacheKeys } from '@/lib/cache/keys';
import type { BudgetPeriod } from '@/lib/types';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';

export const getActiveBudgetPeriodUseCase = async (
  userId: string
): Promise<BudgetPeriod | null> => {
  const getCachedPeriod = cached(
    async () => BudgetPeriodsRepository.findActiveByUser(userId),
    budgetPeriodCacheKeys.activeByUser(userId),
    cacheOptions.activeBudgetPeriod(userId)
  );

  return getCachedPeriod();
};
