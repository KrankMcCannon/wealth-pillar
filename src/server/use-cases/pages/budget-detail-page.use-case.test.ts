import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Budget, Transaction, Category, Account } from '@/lib/types';
import { today as luxonToday } from '@/lib/utils/date-utils';

vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

vi.mock('../budgets/get-budgets.use-case', () => ({
  getBudgetByIdUseCase: vi.fn(),
}));

vi.mock('../budget-periods/get-active-budget-period.use-case', () => ({
  getActiveBudgetPeriodUseCase: vi.fn(),
}));

vi.mock('../transactions/get-transactions.use-case', () => ({
  getTransactionsByUserUseCase: vi.fn(),
}));

vi.mock('@/server/request-cache/services', () => ({
  getAllCategoriesDeduped: vi.fn(),
  getAccountsByGroupDeduped: vi.fn(),
}));

import { notFound } from 'next/navigation';
import { getBudgetByIdUseCase } from '../budgets/get-budgets.use-case';
import { getActiveBudgetPeriodUseCase } from '../budget-periods/get-active-budget-period.use-case';
import { getTransactionsByUserUseCase } from '../transactions/get-transactions.use-case';
import {
  getAllCategoriesDeduped,
  getAccountsByGroupDeduped,
} from '@/server/request-cache/services';
import { getBudgetDetailPageData } from './budget-detail-page.use-case';

const budget: Budget = {
  id: 'b-1',
  user_id: 'user-1',
  group_id: 'group-1',
  description: 'Food',
  amount: 500,
  icon: 'cart',
  type: 'monthly',
  categories: ['food', 'transport'],
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const categories: Category[] = [
  {
    id: 'cat-1',
    key: 'food',
    label: 'Food',
    icon: 'cart',
    color: '#ff0000',
    group_id: 'group-1',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'cat-2',
    key: 'transport',
    label: 'Transport',
    icon: 'car',
    color: '#00ff00',
    group_id: 'group-1',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

const accounts: Account[] = [];

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    description: 'Test',
    amount: 100,
    type: 'expense',
    category: 'food',
    date: '2024-06-10',
    user_id: 'user-1',
    account_id: 'acc-1',
    to_account_id: null,
    frequency: 'once',
    recurring_series_id: null,
    group_id: 'group-1',
    created_at: '2024-06-01',
    updated_at: '2024-06-01',
    ...overrides,
  };
}

describe('getBudgetDetailPageData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBudgetByIdUseCase).mockResolvedValue(budget);
    vi.mocked(getActiveBudgetPeriodUseCase).mockResolvedValue(null);
    vi.mocked(getTransactionsByUserUseCase).mockResolvedValue([tx()]);
    vi.mocked(getAllCategoriesDeduped).mockResolvedValue(categories);
    vi.mocked(getAccountsByGroupDeduped).mockResolvedValue(accounts);
  });

  it('returns budget detail with progress and category breakdown', async () => {
    const txDate = luxonToday().minus({ days: 2 }).toISODate() ?? '';
    vi.mocked(getTransactionsByUserUseCase).mockResolvedValue([tx({ date: txDate })]);
    const data = await getBudgetDetailPageData('group-1', 'b-1');
    expect(data.budget.id).toBe('b-1');
    expect(data.progress.spent).toBe(100);
    expect(data.categoryBreakdown).toHaveLength(1);
    expect(data.categoryBreakdown[0]?.key).toBe('food');
    expect(data.categoryBreakdown[0]?.spent).toBe(100);
    expect(data.groupedTransactions).toHaveLength(1);
  });

  it('calls notFound when budget belongs to another group', async () => {
    vi.mocked(getBudgetByIdUseCase).mockResolvedValue({ ...budget, group_id: 'other-group' });
    await expect(getBudgetDetailPageData('group-1', 'b-1')).rejects.toThrow('NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('calls notFound when budget is missing', async () => {
    vi.mocked(getBudgetByIdUseCase).mockRejectedValue(new Error('Budget not found'));
    await expect(getBudgetDetailPageData('group-1', 'b-1')).rejects.toThrow('NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });
});
