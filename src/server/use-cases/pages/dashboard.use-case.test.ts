import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Account, Budget, BudgetPeriod, User } from '@/lib/types';
import { getBudgetsPageData } from './budgets-page.use-case';

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
    vi.clearAllMocks();
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

  it.each([
    getGroupUsersByGroupIdDeduped,
    getAccountsByGroupDeduped,
    getTransactionsByGroupUseCase,
    getBudgetsByGroupUseCase,
    getSeriesByGroupUseCase,
    getAllCategoriesDeduped,
    getActiveBudgetPeriodsForUsersUseCase,
  ])('propagates a failed dependency and recovers on the next request', async (dependency) => {
    vi.mocked(dependency).mockRejectedValueOnce(new Error('Database unavailable'));
    await expect(getDashboardPageData('g1', groupUsers[0])).rejects.toThrow('Database unavailable');
    const recovered = await getDashboardPageData('g1', groupUsers[0]);
    expect(recovered.accounts).toEqual(accounts);
  });

  it('returns dashboard data without investments field', async () => {
    const result = await getDashboardPageData('g1', groupUsers[0]);

    expect(result.accounts).toEqual(accounts);
    expect(result.recurringSeries).toEqual([]);
    expect(result.categories).toEqual([]);
    expect(result.balanceViewModel.spendableBalanceAll).toBeGreaterThanOrEqual(0);
    expect(result).not.toHaveProperty('investments');
    expect(result).not.toHaveProperty('transactions');
    expect(result.recentActivityByScope).toEqual({ all: [], byUserId: { u1: [] } });
  });

  it('slices recent activity to 3 per scope from the year window', async () => {
    const txs = Array.from({ length: 4 }, (_, i) => ({
      id: `tx${i}`,
      user_id: 'u1',
      group_id: 'g1',
      amount: 10,
      category: 'food',
      date: `2024-06-0${i + 1}`,
      type: 'expense' as const,
      account_id: 'a1',
      description: '',
      created_at: '2024-06-01',
      updated_at: '2024-06-01',
    }));
    vi.mocked(getTransactionsByGroupUseCase).mockResolvedValue({
      data: txs,
      total: 4,
      hasMore: false,
    });

    const result = await getDashboardPageData('g1', groupUsers[0]);

    expect(result.recentActivityByScope.all).toHaveLength(3);
    expect(result.recentActivityByScope.byUserId.u1).toHaveLength(3);
    expect(result.recentActivityByScope.all[0]?.id).toBe('tx0');
  });

  it('uses all 2,500 period transactions, including dates older than the activity window', async () => {
    const period = {
      id: 'p1',
      user_id: 'u1',
      group_id: 'g1',
      start_date: '2023-01-01',
      end_date: null,
      is_active: true,
      created_at: '',
      updated_at: '',
    } as BudgetPeriod;
    vi.mocked(getActiveBudgetPeriodsForUsersUseCase).mockResolvedValue({ u1: period });
    vi.mocked(getBudgetsByGroupUseCase).mockResolvedValue([
      {
        id: 'b1',
        description: 'Food',
        amount: 3000,
        type: 'monthly',
        categories: ['food'],
        user_id: 'u1',
        group_id: 'g1',
        created_at: '',
        updated_at: '',
      } as Budget,
    ]);
    const txs = Array.from({ length: 2500 }, (_, i) => ({
      id: `tx-${i}`,
      description: 'Food',
      amount: 1,
      type: 'expense' as const,
      category: 'food',
      date: '2023-06-10',
      user_id: 'u1',
      account_id: 'a1',
      group_id: 'g1',
      created_at: '',
      updated_at: '',
    }));
    vi.mocked(getTransactionsByGroupUseCase).mockImplementation(async (_group, options) => ({
      data: options?.limit ? [] : txs,
      total: 0,
      hasMore: false,
    }));
    const dashboard = await getDashboardPageData('g1', (groupUsers as User[])[0]!);
    const budgets = await getBudgetsPageData('g1', (groupUsers as User[])[0]!);
    expect(dashboard.budgetsByUser.u1).toEqual(budgets.budgetsByUser.u1);
    expect(dashboard.budgetsByUser.u1?.totalSpent).toBe(2500);
    expect(getTransactionsByGroupUseCase).toHaveBeenCalledWith(
      'g1',
      expect.objectContaining({ startDate: expect.any(Date), countTotal: false })
    );
    const fullReads = vi
      .mocked(getTransactionsByGroupUseCase)
      .mock.calls.filter(([, options]) => options?.limit === undefined);
    expect(fullReads).toHaveLength(2);
    expect(fullReads[0]![1]!.startDate!.getUTCFullYear()).toBeLessThanOrEqual(2023);
  });

  it('does not turn an incomplete budget ledger into a cached financial summary', async () => {
    vi.mocked(getTransactionsByGroupUseCase).mockImplementation(async (_group, options) => ({
      data: [],
      total: 0,
      hasMore: !options?.limit,
    }));
    await expect(getDashboardPageData('g1', (groupUsers as User[])[0]!)).rejects.toThrow(
      'BUDGETS_TRANSACTIONS_OVERFLOW'
    );
  });
});
