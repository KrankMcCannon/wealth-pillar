import type { BudgetPeriod } from '@/lib/types';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';

export const getActiveBudgetPeriodsForUsersUseCase = async (
  userIds: string[]
): Promise<Record<string, BudgetPeriod | null>> => {
  if (userIds.length === 0) return {};

  const activePeriods = await BudgetPeriodsRepository.findActiveByUserIds(userIds);

  const out: Record<string, BudgetPeriod | null> = {};
  for (const id of userIds) {
    out[id] = null;
  }

  for (const period of activePeriods) {
    out[period.user_id] = period;
  }

  return out;
};
