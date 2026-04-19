import type { BudgetPeriod } from '@/lib/types';
import { parseBudgetPeriodsFromJson } from '@/lib/utils/budget-period-json';
import { UsersRepository } from '@/server/repositories/users.repository';
import { jsonToBudgetPeriod } from './get-budget-periods-by-user.use-case';
import { Json } from '@/lib/types/database.types';

export const getActiveBudgetPeriodsForUsersUseCase = async (
  userIds: string[]
): Promise<Record<string, BudgetPeriod | null>> => {
  if (userIds.length === 0) return {};

  const users = await UsersRepository.findByIds(userIds);

  const out: Record<string, BudgetPeriod | null> = {};
  for (const id of userIds) {
    out[id] = null;
  }

  for (const user of users) {
    const userId = user.id;
    const periods = parseBudgetPeriodsFromJson(user.budget_periods as Json);
    const activePeriod = periods.find((p) => p.is_active);
    out[userId] = activePeriod ? jsonToBudgetPeriod(activePeriod, userId) : null;
  }

  return out;
};
