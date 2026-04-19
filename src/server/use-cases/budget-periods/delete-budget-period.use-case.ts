import type { Json } from '@/lib/types/database.types';
import { parseBudgetPeriodsFromJson } from '@/lib/utils/budget-period-json';
import { UsersRepository } from '@/server/repositories/users.repository';
import { invalidateBudgetPeriodCaches } from '@/lib/utils/cache-utils';

export const deleteBudgetPeriodUseCase = async (
  userId: string,
  periodId: string
): Promise<{ id: string }> => {
  const user = await UsersRepository.findById(userId);
  if (!user) throw new Error('User not found');

  const periods = parseBudgetPeriodsFromJson(user.budget_periods as Json);

  const newPeriods = periods.filter((p) => p.id !== periodId);

  await UsersRepository.update(user.id, {
    budget_periods: newPeriods as unknown as Json,
  });

  invalidateBudgetPeriodCaches({ userId, periodId });

  return { id: periodId };
};
