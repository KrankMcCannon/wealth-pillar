import { cached } from '@/lib/cache';
import { cacheOptions } from '@/lib/cache/config';
import { budgetCacheKeys } from '@/lib/cache/keys';
import { BudgetsRepository } from '@/server/repositories/budgets.repository';
import type { Budget } from '@/lib/types';

export async function getBudgetByIdUseCase(budgetId: string): Promise<Budget> {
  if (!budgetId || budgetId.trim() === '') {
    throw new Error('Budget ID is required');
  }

  const getCachedBudget = cached(
    async () => {
      const budget = await BudgetsRepository.getById(budgetId);
      if (!budget) return null;
      return { ...budget, amount: Number(budget.amount) };
    },
    budgetCacheKeys.byId(budgetId),
    cacheOptions.budget(budgetId)
  );

  const budget = await getCachedBudget();

  if (!budget) {
    throw new Error('Budget not found');
  }

  return budget;
}

export async function getBudgetsByUserUseCase(userId: string): Promise<Budget[]> {
  if (!userId || userId.trim() === '') {
    throw new Error('User ID is required');
  }

  const getCachedBudgets = cached(
    async () => {
      const budgets = await BudgetsRepository.getByUser(userId);
      return budgets.map((b) => ({ ...b, amount: Number(b.amount) }));
    },
    budgetCacheKeys.byUser(userId),
    cacheOptions.budgetsByUser(userId)
  );

  const budgets = await getCachedBudgets();

  return budgets || [];
}

export async function getBudgetsByGroupUseCase(groupId: string): Promise<Budget[]> {
  if (!groupId || groupId.trim() === '') {
    throw new Error('Group ID is required');
  }

  const getCachedBudgets = cached(
    async () => {
      const budgets = await BudgetsRepository.getByGroup(groupId);
      return budgets.map((b) => ({ ...b, amount: Number(b.amount) }));
    },
    budgetCacheKeys.byGroup(groupId),
    cacheOptions.budgetsByGroup(groupId)
  );

  const budgets = await getCachedBudgets();

  return budgets || [];
}
