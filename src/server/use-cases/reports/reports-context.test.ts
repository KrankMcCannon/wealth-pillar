import { afterEach, expect, it, vi } from 'vitest';
import { getReportsContextUseCase } from './reports.use-cases';
import { UsersRepository } from '@/server/repositories/users.repository';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { CategoriesRepository } from '@/server/repositories/categories.repository';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { getBudgetsByGroupUseCase } from '@/server/use-cases/budgets/get-budgets.use-case';
import type { User } from '@/lib/types';

vi.mock('@/server/use-cases/budgets/get-budgets.use-case', () => ({
  getBudgetsByGroupUseCase: vi.fn().mockResolvedValue([]),
}));

afterEach(() => vi.restoreAllMocks());

it('loads all authorized report periods once regardless of the group size', async () => {
  const users = Array.from({ length: 25 }, (_, i) => ({
    id: `u${i}`,
    group_id: 'g',
    budget_start_date: 1,
  })) as User[];
  vi.spyOn(UsersRepository, 'findByGroupId').mockResolvedValue(users as never);
  vi.spyOn(AccountsRepository, 'findByGroup').mockResolvedValue([]);
  vi.spyOn(CategoriesRepository, 'findAvailable').mockResolvedValue([]);
  const single = vi.spyOn(BudgetPeriodsRepository, 'findByUser');
  const batch = vi.spyOn(BudgetPeriodsRepository, 'findByUserIds').mockResolvedValue([
    {
      id: 'active',
      user_id: 'u1',
      is_active: true,
      end_date: null,
      start_date: '2026-01-01',
    } as never,
  ]);
  const context = await getReportsContextUseCase('g');
  expect(batch).toHaveBeenCalledExactlyOnceWith(users.map((user) => user.id));
  expect(single).not.toHaveBeenCalled();
  expect(context.periods).toHaveLength(25);
  expect(context.periods.filter((period) => period.user_id === 'u1')).toHaveLength(1);
  expect(getBudgetsByGroupUseCase).toHaveBeenCalledWith('g');
});

it('does not accept foreign user ids from the requested filter', async () => {
  vi.spyOn(UsersRepository, 'findByGroupId').mockResolvedValue([
    { id: 'member', group_id: 'g' },
  ] as never);
  vi.spyOn(AccountsRepository, 'findByGroup').mockResolvedValue([]);
  vi.spyOn(CategoriesRepository, 'findAvailable').mockResolvedValue([]);
  const batch = vi.spyOn(BudgetPeriodsRepository, 'findByUserIds').mockResolvedValue([]);
  const result = await getReportsContextUseCase('g', ['foreign']);
  expect(batch).toHaveBeenCalledExactlyOnceWith([]);
  expect(result.periods).toEqual([]);
});
