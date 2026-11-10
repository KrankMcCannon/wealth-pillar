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
import { RECENT_ACTIVITY_LIMIT } from '@/server/db/query-limits';
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
import { RecentActivityRepository } from '@/server/repositories/recent-activity.repository';
import { withDatabaseOperation } from '@/server/db/telemetry';

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
  const data = await withDatabaseOperation('dashboard', () => getCachedDashboardPageData(groupId));
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
  cacheTag(`group:${groupId}:categories`, `group:00000000-0000-0000-0000-000000000000:categories`);

  const groupUsers = await getGroupUsersByGroupIdDeduped(groupId);
  const userIds = groupUsers.map((u) => u.id);
  for (const id of userIds) cacheTag(CACHE_TAGS.USER_BUDGET_PERIODS(id), `user:${id}:recurring`);
  cacheTag(CACHE_TAGS.GROUP_USERS(groupId));

  const [accounts, budgets, recurringSeries, categories, periodMap] = await Promise.all([
    getAccountsByGroupDeduped(groupId),
    getBudgetsByGroupUseCase(groupId),
    getSeriesByGroupUseCase(groupId),
    getAllCategoriesDeduped(groupId),
    getActiveBudgetPeriodsForUsersUseCase(userIds),
  ]);

  const budgetPeriods: Record<string, BudgetPeriod | null> = {};
  userIds.forEach((userId) => {
    budgetPeriods[userId] = periodMap?.[userId] ?? null;
  });

  const [budgetTransactions, recentActivityByScope] = await Promise.all([
    getBudgetPeriodTransactionsUseCase(groupId, userIds, budgetPeriods),
    RecentActivityRepository.byGroupScopes(groupId, userIds, accounts),
  ]);
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
    recentActivityByScope,
    budgetPeriods,
    recurringSeries,
    categories,
    accountBalances,
    budgetsByUser,
    balanceViewModel,
  };
}
