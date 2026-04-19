import type { BudgetPeriod, BudgetPeriodJSON } from '@/lib/types';
import type { Json } from '@/lib/types/database.types';
import { parseBudgetPeriodsFromJson } from '@/lib/utils/budget-period-json';
import { toDateTime, todayDateString } from '@/lib/utils/date-utils';
import { UsersRepository } from '@/server/repositories/users.repository';
import { invalidateBudgetPeriodCaches } from '@/lib/utils/cache-utils';
import { jsonToBudgetPeriod } from './get-budget-periods-by-user.use-case';
import { DateTime } from 'luxon';

const validateNewPeriod = (userId: string, startDate: string | Date): DateTime => {
  if (!userId) throw new Error('User ID is required');
  if (!startDate) throw new Error('Start date is required');

  const startDt = toDateTime(startDate);
  if (!startDt) throw new Error('Invalid start date format');

  return startDt;
};

const prepareNewPeriodList = (
  currentPeriods: BudgetPeriodJSON[],
  startDt: DateTime
): { updatedPeriods: BudgetPeriodJSON[]; newPeriod: BudgetPeriodJSON } => {
  const dayBeforeStart = startDt.minus({ days: 1 }).toISODate() as string;

  const updatedPeriods = currentPeriods.map((p) => ({
    ...p,
    is_active: false,
    end_date: p.is_active && !p.end_date ? dayBeforeStart : p.end_date,
  }));

  const newPeriod: BudgetPeriodJSON = {
    id: crypto.randomUUID(),
    start_date: startDt.toISODate() as string,
    end_date: null,
    is_active: true,
    created_at: todayDateString(),
    updated_at: todayDateString(),
  };

  updatedPeriods.push(newPeriod);

  return { updatedPeriods, newPeriod };
};

export const createBudgetPeriodUseCase = async (
  userId: string,
  startDate: string | Date
): Promise<BudgetPeriod> => {
  const startDt = validateNewPeriod(userId, startDate);

  const user = await UsersRepository.findById(userId);
  if (!user) throw new Error('User not found');

  const periods = parseBudgetPeriodsFromJson(user.budget_periods as Json);
  const { updatedPeriods, newPeriod } = prepareNewPeriodList(periods, startDt);

  await UsersRepository.update(userId, {
    budget_periods: updatedPeriods as unknown as Json,
  });

  invalidateBudgetPeriodCaches({ userId });

  return jsonToBudgetPeriod(newPeriod, userId);
};
