import type { BudgetPeriod, BudgetPeriodJSON } from '@/lib/types';
import type { Json } from '@/lib/types/database.types';
import { parseBudgetPeriodsFromJson } from '@/lib/utils/budget-period-json';
import { toDateTime, todayDateString } from '@/lib/utils/date-utils';
import { UsersRepository } from '@/server/repositories/users.repository';
import { jsonToBudgetPeriod } from './get-budget-periods-by-user.use-case';
import { createBudgetPeriodUseCase } from './create-budget-period.use-case';
import { DateTime } from 'luxon';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/config';

const validatePeriodClosure = (
  periods: BudgetPeriodJSON[],
  periodId: string,
  endDt: DateTime
): void => {
  const periodToClose = periods.find((p) => p.id === periodId);
  if (!periodToClose) {
    throw new Error('Period not found in user data');
  }

  const startDt = toDateTime(periodToClose.start_date);
  if (!startDt || endDt < startDt) {
    throw new Error('End date must be on or after start date');
  }
};

const updatePeriodsListForClosure = (
  periods: BudgetPeriodJSON[],
  periodId: string,
  endDt: DateTime
): BudgetPeriodJSON[] => {
  return periods.map((p) =>
    p.id === periodId
      ? {
          ...p,
          end_date: endDt.toISODate() as string,
          is_active: false,
          updated_at: todayDateString(),
        }
      : p
  );
};

const autoCreateNextPeriod = async (userId: string, endDt: DateTime): Promise<void> => {
  const nextStartDt = endDt.plus({ days: 1 });
  const nextStartDateStr = nextStartDt.toISODate();

  if (nextStartDateStr) {
    try {
      await createBudgetPeriodUseCase(userId, nextStartDateStr);
    } catch (createError) {
      console.error('[BudgetPeriodService] Failed to auto-create next period:', createError);
    }
  }
};

export const closeBudgetPeriodUseCase = async (
  userId: string,
  periodId: string,
  endDate: string | Date
): Promise<BudgetPeriod | null> => {
  const endDt = toDateTime(endDate);
  if (!endDt) throw new Error('Invalid end date format');

  const user = await UsersRepository.findById(userId);
  if (!user) throw new Error('User not found');

  const periods = parseBudgetPeriodsFromJson(user.budget_periods as Json);

  validatePeriodClosure(periods, periodId, endDt);

  const updatedPeriods = updatePeriodsListForClosure(periods, periodId, endDt);

  await UsersRepository.update(user.id, {
    budget_periods: updatedPeriods as unknown as Json,
  });

  revalidateTag(CACHE_TAGS.USER_PREFERENCE(userId), 'max');

  await autoCreateNextPeriod(userId, endDt);

  const closedPeriod = updatedPeriods.find((p) => p.id === periodId);
  return closedPeriod ? jsonToBudgetPeriod(closedPeriod, userId) : null;
};
