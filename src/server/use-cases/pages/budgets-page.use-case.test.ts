import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BUDGETS_TRANSACTIONS_OVERFLOW } from '@/server/db/query-limits';

vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock('../budgets/get-budgets.use-case', () => ({
  getBudgetsByGroupUseCase: vi.fn(),
}));

vi.mock('../budget-periods/get-active-budget-periods-for-users.use-case', () => ({
  getActiveBudgetPeriodsForUsersUseCase: vi.fn(),
}));

vi.mock('../transactions/get-transactions.use-case', () => ({
  getTransactionsByGroupUseCase: vi.fn(),
}));

vi.mock('@/server/request-cache/services', () => ({
  getAccountsByGroupDeduped: vi.fn(),
  getAllCategoriesDeduped: vi.fn(),
  getGroupUsersByGroupIdDeduped: vi.fn(),
}));

import { getBudgetsByGroupUseCase } from '../budgets/get-budgets.use-case';
import { getActiveBudgetPeriodsForUsersUseCase } from '../budget-periods/get-active-budget-periods-for-users.use-case';
import { getTransactionsByGroupUseCase } from '../transactions/get-transactions.use-case';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
  getGroupUsersByGroupIdDeduped,
} from '@/server/request-cache/services';
import { getBudgetsPageData } from './budgets-page.use-case';

const admin = {
  id: 'u1',
  name: 'Alex',
  email: 'alex@example.com',
  role: 'admin',
  group_id: 'g1',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
} as never;

describe('getBudgetsPageData', () => {
  beforeEach(() => {
    vi.mocked(getGroupUsersByGroupIdDeduped).mockResolvedValue([admin]);
    vi.mocked(getBudgetsByGroupUseCase).mockResolvedValue([]);
    vi.mocked(getAccountsByGroupDeduped).mockResolvedValue([]);
    vi.mocked(getAllCategoriesDeduped).mockResolvedValue([]);
    vi.mocked(getActiveBudgetPeriodsForUsersUseCase).mockResolvedValue({ u1: null });
    vi.mocked(getTransactionsByGroupUseCase).mockResolvedValue({
      data: [],
      total: 0,
      hasMore: false,
    });
  });

  it('omits raw transactions from the page DTO', async () => {
    const result = await getBudgetsPageData('g1', admin);
    expect(result).not.toHaveProperty('transactions');
  });

  it('fails closed when the union period exceeds the transaction cap', async () => {
    vi.mocked(getTransactionsByGroupUseCase).mockResolvedValue({
      data: [],
      total: 0,
      hasMore: true,
    });

    await expect(getBudgetsPageData('g1', admin)).rejects.toThrow(BUDGETS_TRANSACTIONS_OVERFLOW);
  });
});
