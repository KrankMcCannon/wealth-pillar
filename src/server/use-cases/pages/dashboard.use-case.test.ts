import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Account } from '@/lib/types';

vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock('../budget-periods/get-active-budget-periods-for-users.use-case', () => ({
  getActiveBudgetPeriodsForUsersUseCase: vi.fn(),
}));

vi.mock('../recurring/recurring.use-cases', () => ({
  getSeriesByGroupUseCase: vi.fn(),
}));

vi.mock('../transactions/get-transactions.use-case', () => ({
  getTransactionsByGroupUseCase: vi.fn(),
}));

vi.mock('../budgets/get-budgets.use-case', () => ({
  getBudgetsByGroupUseCase: vi.fn(),
}));

vi.mock('@/server/request-cache/services', () => ({
  getAccountsByGroupDeduped: vi.fn(),
  getAllCategoriesDeduped: vi.fn(),
  getGroupUsersByGroupIdDeduped: vi.fn(),
}));

import { getActiveBudgetPeriodsForUsersUseCase } from '../budget-periods/get-active-budget-periods-for-users.use-case';
import { getSeriesByGroupUseCase } from '../recurring/recurring.use-cases';
import { getTransactionsByGroupUseCase } from '../transactions/get-transactions.use-case';
import { getBudgetsByGroupUseCase } from '../budgets/get-budgets.use-case';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
  getGroupUsersByGroupIdDeduped,
} from '@/server/request-cache/services';
import { getDashboardPageData } from './dashboard.use-case';

const groupUsers = [
  {
    id: 'u1',
    name: 'Alex',
    email: 'alex@example.com',
    role: 'admin',
    group_id: 'g1',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
] as never;

const accounts: Account[] = [
  {
    id: 'a1',
    name: 'Main',
    balance: 500,
    type: 'payroll',
    user_ids: ['u1'],
    group_id: 'g1',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

describe('getDashboardPageData', () => {
  beforeEach(() => {
    vi.mocked(getGroupUsersByGroupIdDeduped).mockResolvedValue(groupUsers);
    vi.mocked(getAccountsByGroupDeduped).mockResolvedValue(accounts);
    vi.mocked(getTransactionsByGroupUseCase).mockResolvedValue({
      data: [],
      total: 0,
      hasMore: false,
    });
    vi.mocked(getBudgetsByGroupUseCase).mockResolvedValue([]);
    vi.mocked(getSeriesByGroupUseCase).mockResolvedValue([]);
    vi.mocked(getAllCategoriesDeduped).mockResolvedValue([]);
    vi.mocked(getActiveBudgetPeriodsForUsersUseCase).mockResolvedValue({ u1: null });
  });

  it('returns dashboard data without investments field', async () => {
    const result = await getDashboardPageData('g1');

    expect(result.accounts).toEqual(accounts);
    expect(result.recurringSeries).toEqual([]);
    expect(result.categories).toEqual([]);
    expect(result.balanceViewModel.spendableBalanceAll).toBeGreaterThanOrEqual(0);
    expect(result).not.toHaveProperty('investments');
  });
});
