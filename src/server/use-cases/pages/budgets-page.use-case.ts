import { cacheLife, cacheTag } from 'next/cache';
import { getBudgetsByGroupUseCase } from '../budgets/get-budgets.use-case';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
  getGroupUsersByGroupIdDeduped,
} from '@/server/request-cache/services';
import { getActiveBudgetPeriodsForUsersUseCase } from '../budget-periods/get-active-budget-periods-for-users.use-case';
import { getTransactionsByGroupUseCase } from '../transactions/get-transactions.use-case';
import { buildBudgetsByUserPure } from '../budgets/budget.logic';
import {
  buildBudgetChartViewModel,
  type BudgetChartViewModel,
} from '../budgets/budget-chart.logic';
import type {
  Budget,
  Account,
  Category,
  BudgetPeriod,
  User,
  Transaction,
  UserBudgetSummary,
} from '@/lib/types';
import { scopeBudgetsPageData } from '@/server/permissions/scope-page-data';
import { toDateTime } from '@/lib/utils/date-utils';
import { parsePeriodDates, resolveChartPeriodEnd } from '../shared/period.logic';
import { resolvePeriodAmounts } from '../budget-periods/period-amounts.logic';

export interface BudgetsPageData {
  budgets: Budget[];
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgetPeriods: Record<string, BudgetPeriod | null>;
  budgetsByUser: Record<string, UserBudgetSummary>;
  chartViewModelsByUser: Record<string, BudgetChartViewModel>;
}

async function safeFetch<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    console.error(`[BudgetsPageUseCase] Fetch failed:`, e);
    return fallback;
  }
}

async function getCachedBudgetsPageData(groupId: string): Promise<BudgetsPageData> {
  'use cache';
  cacheLife('minutes');
  cacheTag(`group:${groupId}:budgets`);
  cacheTag(`group:${groupId}:transactions`);
  cacheTag(`group:${groupId}:accounts`);
  cacheTag('categories');

  // 1. Get group users
  let groupUsers: User[] = [];
  try {
    groupUsers = await getGroupUsersByGroupIdDeduped(groupId);
  } catch (error) {
    console.error('[BudgetsPageUseCase] Failed to fetch group users:', error);
  }
  const userIds = groupUsers.map((u) => u.id);

  // 2. Fetch Metadata
  const [budgets, accounts, categories, periodMap] = await Promise.all([
    safeFetch(getBudgetsByGroupUseCase(groupId), [] as Budget[]),
    safeFetch(getAccountsByGroupDeduped(groupId), [] as Account[]),
    safeFetch(getAllCategoriesDeduped(), [] as Category[]),
    safeFetch(
      getActiveBudgetPeriodsForUsersUseCase(userIds),
      {} as Record<string, BudgetPeriod | null>
    ),
  ]);

  // 3. Build Budget Periods & Determine Time Range
  const budgetPeriods: Record<string, BudgetPeriod | null> = {};
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  const now = new Date();

  userIds.forEach((userId) => {
    const period = periodMap?.[userId] ?? null;
    budgetPeriods[userId] = period;

    let start: Date, end: Date;
    if (period) {
      start = new Date(period.start_date);
      const endDateTime = toDateTime(period.end_date ?? '');
      end = endDateTime ? endDateTime.endOf('day').toJSDate() : now;
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }
    if (!minDate || start < minDate) minDate = start;
    if (!maxDate || end > maxDate) maxDate = end;
  });

  // 4. Fetch transactions for the union period (same rows used by the UI list + chart)
  const txOptions: { startDate?: Date; endDate?: Date } = {};
  if (minDate) txOptions.startDate = minDate;
  if (maxDate) txOptions.endDate = maxDate;
  const transactionResult = await getTransactionsByGroupUseCase(groupId, txOptions).catch(() => ({
    data: [] as Transaction[],
    total: 0,
    hasMore: false,
  }));

  // 5. Budget totals from the same transactions as the list/chart (avoids empty RPC aggregates)
  const budgetsByUser = buildBudgetsByUserPure(
    groupUsers,
    budgets,
    transactionResult.data,
    budgetPeriods
  );

  for (const user of groupUsers) {
    const period = budgetPeriods[user.id];
    const summary = budgetsByUser[user.id];
    if (!period || !summary) continue;
    const amounts = resolvePeriodAmounts(period, transactionResult.data, accounts);
    budgetsByUser[user.id] = {
      ...summary,
      periodSpendableSpent: amounts.spendableSpent,
      periodReserveSaved: amounts.reserveSaved,
    };
  }

  const chartViewModelsByUser: Record<string, BudgetChartViewModel> = {};
  for (const user of groupUsers) {
    const userBudgets = budgets.filter((b) => b.user_id === user.id);
    const [periodStart] = parsePeriodDates(budgetPeriods[user.id], now);
    const chartPeriodEnd = resolveChartPeriodEnd(budgetPeriods[user.id], now);
    chartViewModelsByUser[user.id] = buildBudgetChartViewModel(
      transactionResult.data,
      userBudgets,
      user.id,
      periodStart,
      chartPeriodEnd,
      budgetsByUser[user.id] ?? null
    );
  }

  return {
    budgets,
    transactions: transactionResult.data,
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
