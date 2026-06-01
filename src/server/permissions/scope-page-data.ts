import { AccessScope } from '@/lib/permissions/access-scope';
import type { Account, User } from '@/lib/types';
import {
  computeAccountsStatsViewModel,
  computeDashboardBalanceViewModel,
} from '@/server/use-cases/accounts/account.logic';
import type { DashboardPageData } from '@/server/use-cases/pages/dashboard.use-case';
import type { AccountsPageData } from '@/server/use-cases/pages/accounts-page.use-case';
import type { BudgetsPageData } from '@/server/use-cases/pages/budgets-page.use-case';
import type { BudgetDetailPageData } from '@/server/use-cases/pages/budget-detail-page.types';
import type { ReportsPageData } from '@/server/use-cases/pages/reports-page.use-case';
import type { TransactionsListData } from '@/server/use-cases/pages/transactions-page.use-case';

function pickAccountBalances(
  accountBalances: Record<string, number>,
  accounts: Account[]
): Record<string, number> {
  const scoped: Record<string, number> = {};
  for (const account of accounts) {
    const balance = accountBalances[account.id];
    if (balance !== undefined) {
      scoped[account.id] = balance;
    }
  }
  return scoped;
}

/** Restrict dashboard payload to data the current user is allowed to see. */
export function scopeDashboardPageData(
  data: DashboardPageData,
  currentUser: User
): DashboardPageData {
  const scope = AccessScope.for(currentUser);
  if (scope.isAdmin) return data;

  const accounts = scope.filterShared(data.accounts);
  const accountBalances = pickAccountBalances(data.accountBalances, accounts);

  return {
    accounts,
    transactions: scope.filterOwned(data.transactions),
    budgetPeriods: scope.pickUserRecord(data.budgetPeriods),
    recurringSeries: scope.filterShared(data.recurringSeries),
    categories: data.categories,
    accountBalances,
    budgetsByUser: scope.pickUserRecord(data.budgetsByUser),
    balanceViewModel: computeDashboardBalanceViewModel(accounts, accountBalances, [scope.viewerId]),
  };
}

/** Restrict accounts page payload to the current member's accounts and stats. */
export function scopeAccountsPageData(data: AccountsPageData, currentUser: User): AccountsPageData {
  const scope = AccessScope.for(currentUser);
  if (scope.isAdmin) return data;

  const accounts = scope.filterShared(data.accounts);
  const accountBalances = pickAccountBalances(data.accountBalances, accounts);
  const memberStats =
    data.statsByUserId[scope.viewerId] ??
    computeAccountsStatsViewModel(accounts, accountBalances, [scope.viewerId]).byUserId[
      scope.viewerId
    ]!;

  return {
    accounts,
    transactions: [],
    accountBalances,
    statsAll: memberStats,
    statsByUserId: { [scope.viewerId]: memberStats },
  };
}

/** Restrict budgets page payload to the current member's budgets and charts. */
export function scopeBudgetsPageData(data: BudgetsPageData, currentUser: User): BudgetsPageData {
  const scope = AccessScope.for(currentUser);
  if (scope.isAdmin) return data;

  const accounts = scope.filterShared(data.accounts);

  return {
    budgets: scope.filterOwned(data.budgets),
    transactions: scope.filterOwned(data.transactions),
    accounts,
    categories: data.categories,
    budgetPeriods: scope.pickUserRecord(data.budgetPeriods),
    budgetsByUser: scope.pickUserRecord(data.budgetsByUser),
    chartViewModelsByUser: scope.pickUserRecord(data.chartViewModelsByUser),
  };
}

/** Restrict reports payload so members cannot access group-wide or other users' sections. */
export function scopeReportsPageData(data: ReportsPageData, currentUser: User): ReportsPageData {
  const scope = AccessScope.for(currentUser);
  if (scope.isAdmin) return data;

  const memberSection = data.sections[scope.viewerId];
  if (!memberSection) {
    throw new Error('NOT_FOUND');
  }

  return {
    sections: {
      all: memberSection,
      [scope.viewerId]: memberSection,
    },
    periods: data.periods.filter((period) => period.userId === scope.viewerId),
    defaultScope: scope.viewerId,
    preset: data.preset,
    comparisonLabelKey: data.comparisonLabelKey,
  };
}

/** Restrict budget detail payload and verify the member owns the budget. */
export function scopeBudgetDetailPageData(
  data: BudgetDetailPageData,
  currentUser: User
): BudgetDetailPageData {
  const scope = AccessScope.for(currentUser);
  if (!scope.canViewOwned(data.budget)) {
    throw new Error('NOT_FOUND');
  }

  if (scope.isAdmin) return data;

  return {
    ...data,
    accounts: scope.filterShared(data.accounts),
  };
}

/** Restrict transactions list payload accounts and budgets metadata for members. */
export function scopeTransactionsListData(
  data: TransactionsListData,
  currentUser: User
): TransactionsListData {
  const scope = AccessScope.for(currentUser);
  if (scope.isAdmin) return data;

  return {
    ...data,
    accounts: scope.filterShared(data.accounts),
    budgets: scope.filterOwned(data.budgets),
  };
}
