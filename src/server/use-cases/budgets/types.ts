import type { BudgetType } from '@/lib/types';

export interface CreateBudgetInput {
  description: string;
  amount: number;
  type: BudgetType;
  icon?: string | null;
  categories: string[];
  user_id: string;
  group_id?: string;
}

export type UpdateBudgetInput = Partial<CreateBudgetInput>;
