import { BudgetsRepository } from '@/server/repositories/budgets.repository';
import { validateId } from '@/lib/utils/validation-utils';
import { invalidateBudgetCaches } from '@/lib/utils/cache-utils';

export async function deleteBudgetUseCase(id: string): Promise<{ id: string }> {
  validateId(id, 'Budget ID');

  const existing = await BudgetsRepository.getById(id);
  if (!existing) {
    throw new Error('Budget not found');
  }

  await BudgetsRepository.delete(id);

  invalidateBudgetCaches({
    budgetId: id,
    userId: existing.user_id,
    groupId: existing.group_id || undefined,
  });

  return { id };
}

export async function deleteBudgetsByUserUseCase(userId: string): Promise<void> {
  validateId(userId, 'User ID');
  await BudgetsRepository.deleteByUser(userId);
  invalidateBudgetCaches({ userId });
}
