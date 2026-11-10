import { BudgetsRepository, type BudgetScope } from '@/server/repositories/budgets.repository';
import { validateId } from '@/lib/utils/validation-utils';
import { invalidateBudgetCaches } from '@/lib/utils/cache-utils';
import { financialTransaction } from '@/server/repositories/db-executor';

export async function deleteBudgetUseCase(
  id: string,
  scope?: BudgetScope
): Promise<{ id: string }> {
  validateId(id, 'Budget ID');

  const existing = await financialTransaction(async (tx) => {
    const budget = await BudgetsRepository.getById(id, scope, tx);
    if (!budget) throw new Error('Budget not found');
    await BudgetsRepository.delete(id, tx, scope);
    return budget;
  });

  invalidateBudgetCaches({
    budgetId: id,
    userId: existing.user_id,
    groupId: existing.group_id || undefined,
  });

  return { id };
}

export async function deleteBudgetsByUserUseCase(userId: string): Promise<void> {
  validateId(userId, 'User ID');
  await financialTransaction((tx) => BudgetsRepository.deleteByUser(userId, tx));
  invalidateBudgetCaches({ userId });
}
