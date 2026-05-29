import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { invalidateBudgetPeriodCaches } from '@/lib/utils/cache-utils';

export const deleteBudgetPeriodUseCase = async (
  userId: string,
  periodId: string
): Promise<{ id: string }> => {
  const period = await BudgetPeriodsRepository.findById(periodId);
  if (!period || period.user_id !== userId) {
    throw new Error('Period not found');
  }

  await BudgetPeriodsRepository.delete(periodId);

  invalidateBudgetPeriodCaches({ userId, periodId });

  return { id: periodId };
};
