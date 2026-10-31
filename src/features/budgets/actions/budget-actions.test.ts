import { beforeEach, expect, it, vi } from 'vitest';
import type { User, Budget } from '@/lib/types';
import { createBudgetAction, deleteBudgetAction } from './budget-actions';
import { getCurrentUser } from '@/lib/auth/cached-auth';
import { createBudgetUseCase } from '@/server/use-cases/budgets/create-budget.use-case';
import { deleteBudgetUseCase } from '@/server/use-cases/budgets/delete-budget.use-case';
import { getBudgetByIdUseCase } from '@/server/use-cases/budgets/get-budgets.use-case';
import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }));
vi.mock('next/cache', () => ({ updateTag: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('redirect');
  }),
}));
vi.mock('@/lib/auth/cached-auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/server/use-cases/budgets/create-budget.use-case', () => ({
  createBudgetUseCase: vi.fn(),
}));
vi.mock('@/server/use-cases/budgets/update-budget.use-case', () => ({
  updateBudgetUseCase: vi.fn(),
}));
vi.mock('@/server/use-cases/budgets/delete-budget.use-case', () => ({
  deleteBudgetUseCase: vi.fn(),
}));
vi.mock('@/server/use-cases/budgets/get-budgets.use-case', () => ({
  getBudgetByIdUseCase: vi.fn(),
}));
const user = { id: 'u', group_id: 'g', role: 'member' } as User;
const budget = {
  id: 'b',
  user_id: 'u',
  group_id: 'g',
  amount: 10,
  description: 'Food',
  categories: ['food'],
  type: 'monthly',
} as Budget;
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue(user);
  vi.mocked(getBudgetByIdUseCase).mockResolvedValue(budget);
});
it('expires both cached budgets and the aggregate immediately after creating', async () => {
  vi.mocked(createBudgetUseCase).mockResolvedValue(budget);
  expect(
    (
      await createBudgetAction(
        {
          description: 'Food',
          amount: 10,
          categories: ['food'],
          type: 'monthly',
          user_id: 'u',
          group_id: 'g',
        },
        'it'
      )
    ).data
  ).toEqual(budget);
  expect(updateTag).toHaveBeenCalledWith('budgets');
  expect(updateTag).toHaveBeenCalledWith('group:g:budgets');
});
it('does not expire successful reads when a write fails', async () => {
  vi.mocked(createBudgetUseCase).mockRejectedValue(new Error('offline'));
  expect(
    (
      await createBudgetAction(
        {
          description: 'Food',
          amount: 10,
          categories: ['food'],
          type: 'monthly',
          user_id: 'u',
          group_id: 'g',
        },
        'it'
      )
    ).error
  ).toBe('offline');
  expect(updateTag).not.toHaveBeenCalled();
});
it('redirects a deleted detail only after its successful authorized mutation', async () => {
  vi.mocked(deleteBudgetUseCase).mockResolvedValue({ id: 'b' });
  await expect(deleteBudgetAction('b', 'en', true)).rejects.toThrow('redirect');
  expect(redirect).toHaveBeenCalledWith('/en/budgets?user=u');
  expect(updateTag).toHaveBeenCalledWith('group:g:budgets');
});
