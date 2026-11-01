import { beforeEach, expect, it, vi } from 'vitest';
import { UsersRepository } from '@/server/repositories/users.repository';
vi.mock('@/server/repositories/users.repository', () => ({
  UsersRepository: { findByIds: vi.fn() },
}));
import type { User, Budget } from '@/lib/types';
import { createBudgetAction, deleteBudgetAction } from './budget-actions';
import { getCurrentUser } from '@/lib/auth/cached-auth';
import { createBudgetUseCase } from '@/server/use-cases/budgets/create-budget.use-case';
import { deleteBudgetUseCase } from '@/server/use-cases/budgets/delete-budget.use-case';
import { getBudgetByIdUseCase } from '@/server/use-cases/budgets/get-budgets.use-case';
import { redirect } from 'next/navigation';
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }));
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
  vi.mocked(UsersRepository.findByIds).mockResolvedValue([user] as Awaited<
    ReturnType<typeof UsersRepository.findByIds>
  >);
  vi.mocked(getCurrentUser).mockResolvedValue(user);
  vi.mocked(getBudgetByIdUseCase).mockResolvedValue(budget);
});
it('creates a budget in the authenticated group', async () => {
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
  expect(createBudgetUseCase).toHaveBeenCalledWith(
    expect.objectContaining({ group_id: 'g', user_id: 'u' })
  );
});
it('propagates a failed budget write', async () => {
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
});
it('redirects a deleted detail only after its successful authorized mutation', async () => {
  vi.mocked(deleteBudgetUseCase).mockResolvedValue({ id: 'b' });
  await expect(deleteBudgetAction('b', 'en', true)).rejects.toThrow('redirect');
  expect(redirect).toHaveBeenCalledWith('/en/budgets?user=u');
  expect(deleteBudgetUseCase).toHaveBeenCalledWith('b', { groupId: 'g', userId: 'u' });
});
