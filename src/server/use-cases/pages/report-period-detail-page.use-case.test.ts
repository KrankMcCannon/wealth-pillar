import type { Account, Budget, BudgetPeriod, Category, Transaction, User } from '@/lib/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

vi.mock('@/server/repositories/budget-periods.repository', () => ({
  BudgetPeriodsRepository: {
    findById: vi.fn(),
    findByUser: vi.fn(),
  },
}));

vi.mock('@/server/repositories/users.repository', () => ({
  UsersRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('@/server/request-cache/services', () => ({
  getAllCategoriesDeduped: vi.fn(),
  getAccountsByGroupDeduped: vi.fn(),
}));

vi.mock('../budgets/get-budgets.use-case', () => ({
  getBudgetsByUserUseCase: vi.fn(),
}));

vi.mock('../transactions/get-transactions.use-case', () => ({
  getTransactionsByGroupUseCase: vi.fn(),
}));

vi.mock('../reports/reports.use-cases', async () => {
  const actual = await vi.importActual<typeof import('../reports/reports.use-cases')>(
    '../reports/reports.use-cases'
  );
  return {
    ...actual,
    getProcessedUserPeriodsUseCase: vi.fn(),
  };
});

import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { UsersRepository } from '@/server/repositories/users.repository';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
} from '@/server/request-cache/services';
import { notFound } from 'next/navigation';
import { getBudgetsByUserUseCase } from '../budgets/get-budgets.use-case';
import { getProcessedUserPeriodsUseCase } from '../reports/reports.use-cases';
import { getTransactionsByGroupUseCase } from '../transactions/get-transactions.use-case';
import { getReportPeriodDetailPageData } from './report-period-detail-page.use-case';

const owner = {
  id: 'user-1',
  name: 'Owner',
  email: 'owner@example.com',
  role: 'admin',
  group_id: 'group-1',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
} as User;

const member = {
  ...owner,
  id: 'user-2',
  role: 'member',
} as User;

function closedPeriod(overrides: Partial<BudgetPeriod> = {}): BudgetPeriod {
  return {
    id: 'closed-1',
    user_id: 'user-1',
    group_id: 'group-1',
    start_date: '2024-05-01',
    end_date: '2024-05-31',
    is_active: false,
    spendable_spent: 40,
    reserve_saved: 0,
    category_spending: { food: 40 },
    snapshot_at: '2024-05-31T00:00:00.000Z',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function previousPeriod(): BudgetPeriod {
  return closedPeriod({
    id: 'older',
    start_date: '2024-04-01',
    end_date: '2024-04-30',
    category_spending: {},
    spendable_spent: 0,
  });
}

function activePeriod(): BudgetPeriod {
  return {
    id: 'active-1',
    user_id: 'user-1',
    group_id: 'group-1',
    start_date: '2024-06-01',
    end_date: null,
    is_active: true,
    created_at: '',
    updated_at: '',
  };
}

const payroll: Account = {
  id: 'a-spend',
  name: 'Payroll',
  type: 'payroll',
  user_ids: ['user-1'],
  group_id: 'group-1',
  balance: 300,
  liquidity: 'spendable',
  created_at: '',
  updated_at: '',
};

const foodBudget: Budget = {
  id: 'b1',
  description: 'Food',
  amount: 200,
  type: 'monthly',
  icon: null,
  categories: ['food'],
  user_id: 'user-1',
  group_id: 'group-1',
  created_at: '',
  updated_at: '',
};

const foodCategory: Category = {
  id: 'cat-food',
  key: 'food',
  label: 'Food',
  icon: 'cart',
  color: '#00aa00',
  group_id: 'group-1',
  created_at: '',
  updated_at: '',
};

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 't1',
    description: '',
    amount: 40,
    type: 'expense',
    category: 'food',
    date: '2024-05-10',
    user_id: 'user-1',
    account_id: 'a-spend',
    to_account_id: null,
    frequency: 'once',
    recurring_series_id: null,
    group_id: 'group-1',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('getReportPeriodDetailPageData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(UsersRepository.findById).mockResolvedValue(owner as never);
    vi.mocked(getAccountsByGroupDeduped).mockResolvedValue([payroll]);
    vi.mocked(getBudgetsByUserUseCase).mockResolvedValue([foodBudget]);
    vi.mocked(getAllCategoriesDeduped).mockResolvedValue([foodCategory]);
    vi.mocked(getTransactionsByGroupUseCase).mockResolvedValue({
      data: [tx()],
      total: 1,
      hasMore: false,
    });
  });

  it('returns summary and edit flags for the latest closed period without rewind', async () => {
    const closed = closedPeriod({ budgets_snapshot: [foodBudget] });
    const previous = previousPeriod();
    const active = activePeriod();
    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(closed);
    vi.mocked(getProcessedUserPeriodsUseCase).mockResolvedValue([closed, previous, active]);

    const data = await getReportPeriodDetailPageData('group-1', 'closed-1', owner);

    expect(data.periodId).toBe('closed-1');
    expect(data.summary.isOpen).toBe(false);
    expect(data.isLatestClosed).toBe(true);
    expect(data.canRewind).toBe(false);
    expect(data.previousPeriodId).toBeNull();
    expect(data.categoryRows[0]).toMatchObject({ key: 'food', name: 'Food', total: 40 });
    expect(data.storedAmounts.spendableSpent).toBe(40);
    expect(data.periodBudgets).toEqual([foodBudget]);
    expect(data.budgetProgress[0]).toMatchObject({ id: 'b1', amount: 200, spent: 40 });
  });

  it('does not surface live envelopes when a closed period has no snapshot', async () => {
    const closed = closedPeriod();
    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(closed);
    vi.mocked(getProcessedUserPeriodsUseCase).mockResolvedValue([
      closed,
      previousPeriod(),
      activePeriod(),
    ]);

    const data = await getReportPeriodDetailPageData('group-1', 'closed-1', owner);

    expect(data.periodBudgets).toEqual([]);
    expect(data.budgetProgress).toEqual([]);
    expect(data.summary.allocated).toBe(0);
  });

  it('returns rewind flags for the persisted active period', async () => {
    const closed = closedPeriod();
    const previous = previousPeriod();
    const active = activePeriod();
    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(active);
    vi.mocked(getProcessedUserPeriodsUseCase).mockResolvedValue([closed, previous, active]);

    const data = await getReportPeriodDetailPageData('group-1', 'active-1', owner);

    expect(data.periodId).toBe('active-1');
    expect(data.summary.isOpen).toBe(true);
    expect(data.isLatestClosed).toBe(false);
    expect(data.canRewind).toBe(true);
    expect(data.previousPeriodId).toBe('closed-1');
  });

  it('calls notFound when a member loads another user period', async () => {
    const closed = closedPeriod();
    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(closed);
    vi.mocked(getProcessedUserPeriodsUseCase).mockResolvedValue([
      closed,
      previousPeriod(),
      activePeriod(),
    ]);

    await expect(getReportPeriodDetailPageData('group-1', 'closed-1', member)).rejects.toThrow(
      'NOT_FOUND'
    );
    expect(notFound).toHaveBeenCalled();
  });

  it('calls notFound for a synthetic period id', async () => {
    await expect(
      getReportPeriodDetailPageData('group-1', 'active-generated-user-1', owner)
    ).rejects.toThrow('NOT_FOUND');
    expect(BudgetPeriodsRepository.findById).not.toHaveBeenCalled();
  });
});
