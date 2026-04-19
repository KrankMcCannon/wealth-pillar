import { BudgetsRepository, type InsertBudget } from '@/server/repositories/budgets.repository';
import type { CreateBudgetInput } from './types';
import type { Budget } from '@/lib/types';
import { getUserGroupIdUseCase } from '../users/user.use-cases';
import {
  validateRequiredString,
  validatePositiveNumber,
  validateEnum,
  validateNonEmptyArray,
  validateId,
  validateMinLength,
} from '@/lib/utils/validation-utils';
import { invalidateBudgetCaches } from '@/lib/utils/cache-utils';

export async function createBudgetUseCase(data: CreateBudgetInput): Promise<Budget> {
  const description = validateRequiredString(data.description, 'Description');
  validateMinLength(description, 2, 'Description');
  validatePositiveNumber(data.amount, 'Amount');
  validateEnum(data.type, ['monthly', 'annually'] as const, 'Budget type');
  validateNonEmptyArray(data.categories, 'category');
  validateId(data.user_id, 'User ID');

  const groupId = data.group_id || (await getUserGroupIdUseCase(data.user_id));

  const insertData = {
    description,
    amount: data.amount.toString(),
    type: data.type,
    icon: data.icon || null,
    categories: data.categories,
    user_id: data.user_id,
    group_id: groupId,
  };

  const budget = await BudgetsRepository.create(insertData as InsertBudget);

  invalidateBudgetCaches({ userId: data.user_id, groupId });

  return budget;
}
