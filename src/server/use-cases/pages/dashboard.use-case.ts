import { CACHE_TAGS } from '@/lib/cache/config';
import type {
  Account,
  BudgetPeriod,
  Category,
  RecurringTransactionSeries,
  Transaction,
  User,
  UserBudgetSummary,
} from '@/lib/types';
import {
  DASHBOARD_TRANSACTIONS_LIMIT,
  RECENT_ACTIVITY_LIMIT,
  dashboardTransactionStartDate,
} from '@/server/db/query-limits';
import { scopeDashboardPageData } from '@/server/permissions/scope-page-data';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
  getGroupUsersByGroupIdDeduped,
} from '@/server/request-cache/services';
import { cacheLife, cacheTag } from 'next/cache';
import {
  computeDashboardBalanceViewModel,
  type DashboardBalanceViewModel,
} from '../accounts/account.logic';
import { getActiveBudgetPeriodsForUsersUseCase } from '../budget-periods/get-active-budget-periods-for-users.use-case';
import { buildBudgetsByUserPure } from '../budgets/budget.logic';
import { getBudgetsByGroupUseCase } from '../budgets/get-budgets.use-case';
import { getBudgetPeriodTransactionsUseCase } from '../budgets/get-budget-period-transactions.use-case';
import { getSeriesByGroupUseCase } from '../recurring/recurring.use-cases';
import { transactionInvolvesUser } from '@/server/ledger';
import { getTransactionsByGroupUseCase } from '../transactions/get-transactions.use-case';

export interface RecentActivityByScope {
  all: Transaction[];
  byUserId: Record<string, Transaction[]>;
}

export function buildRecentActivityByScope(
  transactions: Transaction[],
  userIds: string[],
  accounts: Account[] = []
): RecentActivityByScope {
  const byUserId: Record<string, Transaction[]> = {};
  for (const userId of userIds) {
    byUserId[userId] = [];
  }
  for (const tx of transactions) {
    for (const userId of userIds) {
      const bucket = byUserId[userId];
      if (!bucket || bucket.length >= RECENT_ACTIVITY_LIMIT) continue;
      if (!transactionInvolvesUser(tx, userId, accounts)) continue;
      bucket.push(tx);
    }
  }
  return {
    all: transactions.slice(0, RECENT_ACTIVITY_LIMIT),
    byUserId,
  };
}

export interface DashboardPageData {
  accounts: Account[];
  recentActivityByScope: RecentActivityByScope;
  budgetPeriods: Record<string, BudgetPeriod | null>;
  recurringSeries: RecurringTransactionSeries[];
  categories: Category[];
  accountBalances: Record<string, number>;
  budgetsByUser: Record<string, UserBudgetSummary>;
  balanceViewModel: DashboardBalanceViewModel;
}

/**
 * Fetch dashboard data scoped to the current user's role.
 */
export async function getDashboardPageData(
  groupId: string,
  currentUser: User
): Promise<DashboardPageData> {
  const data = await getCachedDashboardPageData(groupId);
  return scopeDashboardPageData(data, currentUser);
}

async function getCachedDashboardPageData(groupId: string): Promise<DashboardPageData> {
  'use cache';
  cacheLife('minutes');
  cacheTag(`group:${groupId}:transactions`);
  cacheTag(`group:${groupId}:budgets`);
  cacheTag(`group:${groupId}:accounts`);
  cacheTag(CACHE_TAGS.BUDGET_PERIODS);
  cacheTag(CACHE_TAGS.RECURRING_SERIES);
  cacheTag(`group:${groupId}:recurring`);
  cacheTag('categories');

  const groupUsers = await getGroupUsersByGroupIdDeduped(groupId);
  const userIds = groupUsers.map((u) => u.id);

  const [accounts, transactionResult, budgets, recurringSeries, categories, periodMap] =
    await Promise.all([
      getAccountsByGroupDeduped(groupId),
      getTransactionsByGroupUseCase(groupId, {
        startDate: dashboardTransactionStartDate(),
        limit: DASHBOARD_TRANSACTIONS_LIMIT,
        countTotal: false,
      }),
      getBudgetsByGroupUseCase(groupId),
      getSeriesByGroupUseCase(groupId),
      getAllCategoriesDeduped(),
      getActiveBudgetPeriodsForUsersUseCase(userIds),
    ]);

  const budgetPeriods: Record<string, BudgetPeriod | null> = {};
  userIds.forEach((userId) => {
    budgetPeriods[userId] = periodMap?.[userId] ?? null;
  });

  const budgetTransactions = await getBudgetPeriodTransactionsUseCase(
    groupId,
    userIds,
    budgetPeriods
  );
  const budgetsByUser = buildBudgetsByUserPure(
    groupUsers,
    budgets,
    budgetTransactions,
    budgetPeriods,
    undefined,
    accounts
  );

  const accountBalances: Record<string, number> = {};
  accounts.forEach((a) => {
    accountBalances[a.id] = Number(a.balance) || 0;
  });

  const balanceViewModel = computeDashboardBalanceViewModel(accounts, accountBalances, userIds);

  return {
    accounts,
    recentActivityByScope: buildRecentActivityByScope(transactionResult.data, userIds, accounts),
    budgetPeriods,
    recurringSeries,
    categories,
    accountBalances,
    budgetsByUser,
    balanceViewModel,
  };
}
