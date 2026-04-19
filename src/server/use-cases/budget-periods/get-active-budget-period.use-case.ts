import { cached } from '@/lib/cache';
import { cacheOptions } from '@/lib/cache/config';
import { budgetPeriodCacheKeys } from '@/lib/cache/keys';
import type { BudgetPeriod } from '@/lib/types';
import { parseBudgetPeriodsFromJson } from '@/lib/utils/budget-period-json';
import { UsersRepository } from '@/server/repositories/users.repository';
import { jsonToBudgetPeriod } from './get-budget-periods-by-user.use-case';
import type { Json } from '@/lib/types/database.types';

export const getActiveBudgetPeriodUseCase = async (
  userId: string
): Promise<BudgetPeriod | null> => {
  const getCachedPeriod = cached(
    async () => {
      const user = await UsersRepository.findById(userId);

      if (!user) {
        return null;
      }

      const periods = parseBudgetPeriodsFromJson(user.budget_periods as Json);
      const activePeriod = periods.find((p) => p.is_active);

      return activePeriod ? jsonToBudgetPeriod(activePeriod, userId) : null;
    },
    budgetPeriodCacheKeys.activeByUser(userId),
    cacheOptions.activeBudgetPeriod(userId)
  );

  const period = await getCachedPeriod();
  return period;
};
