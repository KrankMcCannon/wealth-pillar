import { describe, it, expect } from 'vitest';
import type { Account, Transaction, User } from '@/lib/types';
import { AccessScope } from '@/lib/permissions/access-scope';
import {
  scopeAccountsPageData,
  scopeBudgetDetailPageData,
  scopeBudgetsPageData,
  scopeDashboardPageData,
  scopeReportsPageData,
  scopeTransactionsListData,
} from './scope-page-data';
import type { TransactionsListData } from '@/server/use-cases/pages/transactions-page.use-case';
import type { DashboardPageData } from '@/server/use-cases/pages/dashboard.use-case';
import type { AccountsPageData } from '@/server/use-cases/pages/accounts-page.use-case';
import type { BudgetsPageData } from '@/server/use-cases/pages/budgets-page.use-case';
import type { ReportsPageData } from '@/server/use-cases/pages/reports-page.use-case';
import type { BudgetDetailPageData } from '@/server/use-cases/pages/budget-detail-page.types';

const member = {
  id: 'member-1',
  name: 'Member',
  email: 'member@example.com',
  role: 'member',
  group_id: 'g1',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
} as User;

const admin = {
  id: 'admin-1',
  name: 'Admin',
  email: 'admin@example.com',
  role: 'admin',
  group_id: 'g1',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
} as User;

const accountA: Account = {
  id: 'a1',
  name: 'Mine',
  type: 'payroll',
  user_ids: ['member-1'],
  group_id: 'g1',
  balance: 100,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const accountB: Account = {
  id: 'a2',
  name: 'Other',
  type: 'payroll',
  user_ids: ['member-2'],
  group_id: 'g1',
  balance: 500,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const txA: Transaction = {
  id: 'tx1',
  description: 'Mine',
  amount: 10,
  type: 'expense',
  category: 'food',
  date: '2024-06-01',
  user_id: 'member-1',
  account_id: 'a1',
  created_at: '2024-06-01',
  updated_at: '2024-06-01',
};

const txB: Transaction = {
  ...txA,
  id: 'tx2',
  description: 'Other',
  user_id: 'member-2',
  account_id: 'a2',
};

describe('AccessScope filterShared', () => {
  it('returns only accounts linked to the user', () => {
    expect(AccessScope.for(member).filterShared([accountA, accountB])).toEqual([accountA]);
  });
});

describe('scopeDashboardPageData', () => {
  const dashboardData: DashboardPageData = {
    accounts: [accountA, accountB],
    transactions: [txA, txB],
    budgetPeriods: { 'member-1': null, 'member-2': null },
    recurringSeries: [],
    categories: [],
    accountBalances: { a1: 100, a2: 500 },
    budgetsByUser: {
      'member-1': {
        user: member,
        budgets: [],
        totalBudget: 0,
        totalSpent: 0,
        totalRemaining: 0,
        overallPercentage: 0,
        activePeriod: null,
        periodStart: null,
        periodEnd: null,
      } as never,
      'member-2': {
        user: { ...member, id: 'member-2' },
        budgets: [],
        totalBudget: 999,
        totalSpent: 0,
        totalRemaining: 999,
        overallPercentage: 0,
        activePeriod: null,
        periodStart: null,
        periodEnd: null,
      } as never,
    },
    balanceViewModel: {
      totalBalanceAll: 600,
      spendableBalanceAll: 600,
      reserveBalanceAll: 0,
      totalBalanceByUserId: { 'member-1': 100, 'member-2': 500 },
      spendableByUserId: { 'member-1': 100, 'member-2': 500 },
      reserveByUserId: { 'member-1': 0, 'member-2': 0 },
    },
  };

  it('scopes member data to their own records', () => {
    const scoped = scopeDashboardPageData(dashboardData, member);

    expect(scoped.accounts).toEqual([accountA]);
    expect(scoped.transactions).toEqual([txA]);
    expect(Object.keys(scoped.budgetsByUser)).toEqual(['member-1']);
    expect(scoped.balanceViewModel.spendableBalanceAll).toBe(100);
    expect(scoped.balanceViewModel.spendableByUserId).toEqual({ 'member-1': 100 });
  });

  it('returns full data for admins', () => {
    expect(scopeDashboardPageData(dashboardData, admin)).toEqual(dashboardData);
  });
});

describe('scopeAccountsPageData', () => {
  const pageData: AccountsPageData = {
    accounts: [accountA, accountB],
    transactions: [],
    accountBalances: { a1: 100, a2: 500 },
    statsAll: {
      totalBalance: 600,
      spendableBalance: 600,
      reserveBalance: 0,
      totalAccounts: 2,
      positiveAccounts: 2,
      negativeAccounts: 0,
    },
    statsByUserId: {
      'member-1': {
        totalBalance: 100,
        spendableBalance: 100,
        reserveBalance: 0,
        totalAccounts: 1,
        positiveAccounts: 1,
        negativeAccounts: 0,
      },
      'member-2': {
        totalBalance: 500,
        spendableBalance: 500,
        reserveBalance: 0,
        totalAccounts: 1,
        positiveAccounts: 1,
        negativeAccounts: 0,
      },
    },
  };

  it('scopes member stats to their own accounts', () => {
    const scoped = scopeAccountsPageData(pageData, member);

    expect(scoped.accounts).toEqual([accountA]);
    expect(scoped.statsAll.totalBalance).toBe(100);
    expect(Object.keys(scoped.statsByUserId)).toEqual(['member-1']);
  });
});

describe('scopeBudgetsPageData', () => {
  const pageData: BudgetsPageData = {
    budgets: [
      { id: 'b1', user_id: 'member-1', group_id: 'g1', amount: 100, category: 'food' } as never,
      { id: 'b2', user_id: 'member-2', group_id: 'g1', amount: 200, category: 'food' } as never,
    ],
    transactions: [txA, txB],
    accounts: [accountA, accountB],
    categories: [],
    budgetPeriods: { 'member-1': null, 'member-2': null },
    budgetsByUser: { 'member-1': {} as never, 'member-2': {} as never },
    chartViewModelsByUser: { 'member-1': {} as never, 'member-2': {} as never },
  };

  it('scopes member budgets to their own user id', () => {
    const scoped = scopeBudgetsPageData(pageData, member);

    expect(scoped.budgets.map((b) => b.id)).toEqual(['b1']);
    expect(scoped.transactions).toEqual([txA]);
    expect(Object.keys(scoped.budgetsByUser)).toEqual(['member-1']);
  });
});

describe('scopeReportsPageData', () => {
  const memberSection = {
    netFlow: 10,
    income: 20,
    expenses: 10,
    totalSpendable: 100,
    totalReserve: 0,
    netSavings: { amount: 10, rate: 0.1 } as never,
    comparisonPercent: 0,
    topExpenses: [],
    accountBreakdown: [],
    totalWealth: 100,
  };

  const allSection = {
    ...memberSection,
    netFlow: 999,
    totalWealth: 999,
  };

  const pageData: ReportsPageData = {
    sections: {
      all: allSection as never,
      'member-1': memberSection as never,
      'member-2': { ...memberSection, netFlow: 50, totalWealth: 50 } as never,
    },
    periods: [
      { userId: 'member-1', startDate: '2024-01-01', endDate: '2024-01-31' } as never,
      { userId: 'member-2', startDate: '2024-01-01', endDate: '2024-01-31' } as never,
    ],
    defaultScope: 'all',
    preset: 'monthly',
    comparisonLabelKey: 'vsLastMonth',
  };

  it('forces members to their own report section', () => {
    const scoped = scopeReportsPageData(pageData, member);

    expect(scoped.defaultScope).toBe('member-1');
    expect(scoped.sections.all.netFlow).toBe(10);
    expect(scoped.sections['member-2']).toBeUndefined();
    expect(scoped.periods).toHaveLength(1);
  });
});

describe('scopeTransactionsListData', () => {
  const listData: TransactionsListData = {
    transactions: [txA],
    hasMore: false,
    appliedQuery: { type: 'all', dateRange: 'all', user: 'member-1' },
    categories: [],
    accounts: [accountA, accountB],
    budgets: [
      { id: 'b1', user_id: 'member-1', group_id: 'g1', amount: 100, category: 'food' } as never,
      { id: 'b2', user_id: 'member-2', group_id: 'g1', amount: 200, category: 'food' } as never,
    ],
  };

  it('scopes member accounts and budgets metadata', () => {
    const scoped = scopeTransactionsListData(listData, member);

    expect(scoped.accounts).toEqual([accountA]);
    expect(scoped.budgets.map((b) => b.id)).toEqual(['b1']);
    expect(scoped.transactions).toEqual([txA]);
  });

  it('returns full data for admins', () => {
    expect(scopeTransactionsListData(listData, admin)).toEqual(listData);
  });
});

describe('scopeBudgetDetailPageData', () => {
  const pageData: BudgetDetailPageData = {
    budget: { id: 'b1', user_id: 'member-2', group_id: 'g1' } as never,
    progress: {} as never,
    activePeriod: null,
    periodStart: null,
    periodEnd: null,
    categoryBreakdown: [],
    groupedTransactions: [],
    accounts: [accountA, accountB],
    categories: [],
  };

  it('denies access to another member budget', () => {
    expect(() => scopeBudgetDetailPageData(pageData, member)).toThrow('NOT_FOUND');
  });

  it('allows access to own budget and scopes accounts', () => {
    const ownData = {
      ...pageData,
      budget: { ...pageData.budget, user_id: 'member-1' },
    };

    const scoped = scopeBudgetDetailPageData(ownData, member);
    expect(scoped.accounts).toEqual([accountA]);
  });
});
