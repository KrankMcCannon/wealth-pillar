import { getBudgetsByGroupUseCase } from '../budgets/get-budgets.use-case';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
  getGroupUsersByGroupIdDeduped,
} from '@/server/request-cache/services';
import { getActiveBudgetPeriodsForUsersUseCase } from '../budget-periods/get-active-budget-periods-for-users.use-case';
import { getTransactionsByGroupUseCase } from '../transactions/get-transactions.use-case';
import { buildBudgetsByUserPure } from '../budgets/budget.logic';
import type {
  Budget,
  Account,
  Category,
  BudgetPeriod,
  User,
  Transaction,
  UserBudgetSummary,
} from '@/lib/types';
import { toDateTime } from '@/lib/utils/date-utils';

export interface BudgetsPageData {
  budgets: Budget[];
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgetPeriods: Record<string, BudgetPeriod | null>;
  budgetsByUser: Record<string, UserBudgetSummary>;
}

async function safeFetch<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    console.error(`[BudgetsPageUseCase] Fetch failed:`, e);
    return fallback;
  }
}

export async function getBudgetsPageData(groupId: string): Promise<BudgetsPageData> {
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

  return {
    budgets,
    transactions: transactionResult.data,
    accounts,
    categories,
    budgetPeriods,
    budgetsByUser,
  };
}
