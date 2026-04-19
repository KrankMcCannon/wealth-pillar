import { cached } from '@/lib/cache';
import { cacheOptions } from '@/lib/cache/config';
import { budgetPeriodCacheKeys } from '@/lib/cache/keys';
import type { BudgetPeriod, BudgetPeriodJSON } from '@/lib/types';
import { parseBudgetPeriodsFromJson } from '@/lib/utils/budget-period-json';
import { UsersRepository } from '@/server/repositories/users.repository';
import type { Json } from '@/lib/types/database.types';

export const jsonToBudgetPeriod = (json: BudgetPeriodJSON, userId: string): BudgetPeriod => {
  return {
    id: json.id,
    user_id: userId,
    start_date: json.start_date,
    end_date: json.end_date,
    is_active: json.is_active,
    created_at: json.created_at,
    updated_at: json.updated_at,
  };
};

export const getBudgetsPeriodsByUserUseCase = async (userId: string): Promise<BudgetPeriod[]> => {
  const getCachedPeriods = cached(
    async () => {
      const user = await UsersRepository.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const periods = parseBudgetPeriodsFromJson(user.budget_periods as Json)
        .map((p) => jsonToBudgetPeriod(p, userId))
        .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

      return periods;
    },
    budgetPeriodCacheKeys.byUser(userId),
    cacheOptions.budgetPeriodsByUser(userId)
  );

  const periods = await getCachedPeriods();
  return periods || [];
};
