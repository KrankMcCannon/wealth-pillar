import type { Budget } from '@/lib/types';
import type { BudgetFormData } from '../components/budget-form-fields';

export function mapBudgetToFormData(budget: Budget): BudgetFormData {
  return {
    description: budget.description,
    amount: budget.amount.toString(),
    type: budget.type,
    icon: budget.icon,
    categories: budget.categories,
    user_id: budget.user_id,
  };
}

export function buildBudgetPayload(data: BudgetFormData, groupId: string) {
  return {
    description: data.description.trim(),
    amount: Number.parseFloat(data.amount),
    type: data.type,
    icon: data.icon ?? null,
    categories: data.categories,
    user_id: data.user_id,
    group_id: groupId,
  };
}
