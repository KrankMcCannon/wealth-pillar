import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Budget } from '@/lib/types';

const afterCallbacks: Array<() => void> = [];

vi.mock('next/server', () => ({
  after: (fn: () => void) => {
    afterCallbacks.push(fn);
  },
}));

vi.mock('@/server/repositories/budgets.repository', () => ({
  BudgetsRepository: {
    getById: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/server/repositories/budget-periods.repository', () => ({
  BudgetPeriodsRepository: {
    update: vi.fn(),
  },
}));

vi.mock('@/lib/utils/cache-utils', () => ({
  invalidateBudgetCaches: vi.fn(),
}));

import { BudgetsRepository } from '@/server/repositories/budgets.repository';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { invalidateBudgetCaches } from '@/lib/utils/cache-utils';
import { updateBudgetUseCase } from './update-budget.use-case';

const existing: Budget = {
  id: 'b1',
  description: 'Food',
  amount: 200,
  type: 'monthly',
  icon: null,
  categories: ['food'],
  user_id: 'u1',
  group_id: 'g1',
  created_at: '',
  updated_at: '',
};

const updated: Budget = { ...existing, amount: 250, description: 'Groceries' };

describe('updateBudgetUseCase', () => {
  beforeEach(() => {
    afterCallbacks.length = 0;
    vi.clearAllMocks();
    vi.mocked(BudgetsRepository.getById).mockResolvedValue(existing);
    vi.mocked(BudgetsRepository.update).mockResolvedValue(updated);
  });

  it('writes only the live budget row and defers cache invalidation', async () => {
    const result = await updateBudgetUseCase('b1', { description: 'Groceries', amount: 250 });

    expect(result).toEqual(updated);
    expect(BudgetsRepository.update).toHaveBeenCalledWith(
      'b1',
      expect.objectContaining({ description: 'Groceries', amount: '250' })
    );
    expect(BudgetPeriodsRepository.update).not.toHaveBeenCalled();
    expect(invalidateBudgetCaches).not.toHaveBeenCalled();

    afterCallbacks.forEach((fn) => fn());

    expect(invalidateBudgetCaches).toHaveBeenCalledWith({
      budgetId: 'b1',
      userId: 'u1',
      groupId: 'g1',
    });
  });
});
