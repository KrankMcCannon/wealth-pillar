import { CACHE_TAGS } from '@/lib/cache/config';
import type { Account, Budget, BudgetPeriod, Category, User, UserBudgetSummary } from '@/lib/types';
import { scopeBudgetsPageData } from '@/server/permissions/scope-page-data';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
  getGroupUsersByGroupIdDeduped,
} from '@/server/request-cache/services';
import { cacheLife, cacheTag } from 'next/cache';
import { getActiveBudgetPeriodsForUsersUseCase } from '../budget-periods/get-active-budget-periods-for-users.use-case';
import {
  buildBudgetChartViewModel,
  type BudgetChartViewModel,
} from '../budgets/budget-chart.logic';
import { buildBudgetsByUserPure } from '../budgets/budget.logic';
import { getBudgetsByGroupUseCase } from '../budgets/get-budgets.use-case';
import { parsePeriodDates, resolveChartPeriodEnd } from '../shared/period.logic';
import { getBudgetPeriodTransactionsUseCase } from '../budgets/get-budget-period-transactions.use-case';

export interface BudgetsPageData {
  budgets: Budget[];
  accounts: Account[];
  categories: Category[];
  budgetPeriods: Record<string, BudgetPeriod | null>;
  budgetsByUser: Record<string, UserBudgetSummary>;
  chartViewModelsByUser: Record<string, BudgetChartViewModel>;
}

async function getCachedBudgetsPageData(groupId: string): Promise<BudgetsPageData> {
  'use cache';
  cacheLife('minutes');
  cacheTag(`group:${groupId}:budgets`);
  cacheTag(`group:${groupId}:transactions`);
  cacheTag(`group:${groupId}:accounts`);
  cacheTag(CACHE_TAGS.BUDGET_PERIODS);
  cacheTag('categories');

  const groupUsers = await getGroupUsersByGroupIdDeduped(groupId);
  const userIds = groupUsers.map((u) => u.id);

  const [budgets, accounts, categories, periodMap] = await Promise.all([
    getBudgetsByGroupUseCase(groupId),
    getAccountsByGroupDeduped(groupId),
    getAllCategoriesDeduped(),
    getActiveBudgetPeriodsForUsersUseCase(userIds),
  ]);

  // 3. Build Budget Periods & Determine Time Range
  const budgetPeriods: Record<string, BudgetPeriod | null> = {};
  const now = new Date();
  userIds.forEach((userId) => {
    budgetPeriods[userId] = periodMap?.[userId] ?? null;
  });
  const budgetTransactions = await getBudgetPeriodTransactionsUseCase(
    groupId,
    userIds,
    budgetPeriods,
    now
  );

  // 5. Budget totals from the same transactions as the list/chart (avoids empty RPC aggregates)
  const budgetsByUser = buildBudgetsByUserPure(
    groupUsers,
    budgets,
    budgetTransactions,
    budgetPeriods,
    undefined,
    accounts
  );

  const chartViewModelsByUser: Record<string, BudgetChartViewModel> = {};
  for (const user of groupUsers) {
    const userBudgets = budgets.filter((b) => b.user_id === user.id);
    const [periodStart] = parsePeriodDates(budgetPeriods[user.id], now);
    const chartPeriodEnd = resolveChartPeriodEnd(budgetPeriods[user.id], now);
    chartViewModelsByUser[user.id] = buildBudgetChartViewModel(
      budgetTransactions,
      userBudgets,
      user.id,
      periodStart,
      chartPeriodEnd,
      budgetsByUser[user.id] ?? null,
      accounts
    );
  }

  return {
    budgets,
    accounts,
    categories,
    budgetPeriods,
    budgetsByUser,
    chartViewModelsByUser,
  };
}

export async function getBudgetsPageData(
  groupId: string,
  currentUser: User
): Promise<BudgetsPageData> {
  const data = await getCachedBudgetsPageData(groupId);
  return scopeBudgetsPageData(data, currentUser);
}
