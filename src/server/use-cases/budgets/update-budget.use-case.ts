import { BudgetsRepository, type UpdateBudget } from '@/server/repositories/budgets.repository';
import type { UpdateBudgetInput } from './types';
import type { Budget } from '@/lib/types';
import { invalidateBudgetCaches } from '@/lib/utils/cache-utils';

export async function updateBudgetUseCase(id: string, data: UpdateBudgetInput): Promise<Budget> {
  if (!id || id.trim() === '') {
    throw new Error('Budget ID is required');
  }

  if (data.description !== undefined) {
    if (data.description.trim() === '') throw new Error('Description cannot be empty');
    if (data.description.trim().length < 2)
      throw new Error('Description must be at least 2 characters');
  }
  if (data.amount !== undefined && data.amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }
  if (data.type !== undefined && !['monthly', 'annually'].includes(data.type)) {
    throw new Error('Invalid budget type');
  }
  if (data.categories?.length === 0) {
    throw new Error('At least one category is required');
  }
  if (data.user_id !== undefined && data.user_id.trim() === '') {
    throw new Error('User ID cannot be empty');
  }

  const existing = await BudgetsRepository.getById(id);
  if (!existing) {
    throw new Error('Budget not found');
  }

  const updateData: Partial<UpdateBudget> = { updated_at: new Date() };

  if (data.description !== undefined) updateData.description = data.description.trim();
  if (data.amount !== undefined) updateData.amount = data.amount.toString();
  if (data.type !== undefined) updateData.type = data.type;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.categories !== undefined) updateData.categories = data.categories;
  if (data.user_id !== undefined) updateData.user_id = data.user_id;

  const updatedBudget = await BudgetsRepository.update(id, updateData);

  invalidateBudgetCaches({
    budgetId: id,
    userId: existing.user_id,
    groupId: existing.group_id || undefined,
  });

  if (data.user_id && data.user_id !== existing.user_id) {
    invalidateBudgetCaches({ userId: data.user_id });
  }

  return updatedBudget;
}
