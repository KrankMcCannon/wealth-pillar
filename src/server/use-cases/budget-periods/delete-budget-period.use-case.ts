import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { invalidateBudgetPeriodCaches } from '@/lib/utils/cache-utils';
import { withBudgetPeriodTransaction } from './budget-period-transaction';

export const deleteBudgetPeriodUseCase = async (
  userId: string,
  periodId: string
): Promise<{ id: string }> => {
  await withBudgetPeriodTransaction(userId, async (tx) => {
    const period = await BudgetPeriodsRepository.findById(periodId, tx);
    if (!period || period.user_id !== userId) {
      throw new Error('Period not found');
    }

    await BudgetPeriodsRepository.delete(periodId, tx);
  });

  invalidateBudgetPeriodCaches({ userId, periodId });

  return { id: periodId };
};
