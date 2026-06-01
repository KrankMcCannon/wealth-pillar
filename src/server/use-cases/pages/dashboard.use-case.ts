import { cacheLife, cacheTag } from 'next/cache';
import { getActiveBudgetPeriodsForUsersUseCase } from '../budget-periods/get-active-budget-periods-for-users.use-case';
import { getSeriesByGroupUseCase } from '../recurring/recurring.use-cases';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
  getGroupUsersByGroupIdDeduped,
} from '@/server/request-cache/services';
import { getTransactionsByGroupUseCase } from '../transactions/get-transactions.use-case';
import {
  DASHBOARD_TRANSACTIONS_LIMIT,
  dashboardTransactionStartDate,
} from '@/server/db/query-limits';
import { getBudgetsByGroupUseCase } from '../budgets/get-budgets.use-case';
import { buildBudgetsByUserPure } from '../budgets/budget.logic';
import {
  computeDashboardBalanceViewModel,
  type DashboardBalanceViewModel,
} from '../accounts/account.logic';
import { resolvePeriodAmounts } from '../budget-periods/period-amounts.logic';
import type {
  Account,
  Transaction,
  Budget,
  BudgetPeriod,
  Category,
  RecurringTransactionSeries,
  UserBudgetSummary,
  User,
} from '@/lib/types';
import { scopeDashboardPageData } from '@/server/permissions/scope-page-data';

/**
 * Check if an error is a request abort error (specific to Next.js/Supabase)
 */
function isRequestAbortError(error: unknown): boolean {
  if (error == null) return false;
  const message =
    typeof error === 'string'
      ? error
      : typeof error === 'object' && 'message' in error
        ? String((error as { message?: string }).message)
        : '';
  return /abort/i.test(message);
}

/**
 * Helper to safely fetch data with error logging and fallback
 */
async function safeFetch<T>(promise: Promise<T>, fallback: T, context: string): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    if (!isRequestAbortError(e)) {
      console.error(`[PageDataUseCase] ${context}:`, e);
    }
    return fallback;
  }
}

export interface DashboardPageData {
  accounts: Account[];
  transactions: Transaction[];
  budgetPeriods: Record<string, BudgetPeriod | null>;
  recurringSeries: RecurringTransactionSeries[];
  categories: Category[];
  accountBalances: Record<string, number>;
  budgetsByUser: Record<string, UserBudgetSummary>;
  balanceViewModel: DashboardBalanceViewModel;
}

function enrichBudgetSummariesWithPeriodAmounts(
  budgetsByUser: Record<string, UserBudgetSummary>,
  groupUsers: User[],
  transactions: Transaction[],
  accounts: Account[],
  budgetPeriods: Record<string, BudgetPeriod | null>
): Record<string, UserBudgetSummary> {
  const result = { ...budgetsByUser };
  for (const user of groupUsers) {
    const period = budgetPeriods[user.id];
    const summary = result[user.id];
    if (!period || !summary) continue;
    const amounts = resolvePeriodAmounts(period, transactions, accounts);
    result[user.id] = {
      ...summary,
      periodSpendableSpent: amounts.spendableSpent,
      periodReserveSaved: amounts.reserveSaved,
    };
  }
  return result;
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
  cacheTag('categories');

  let groupUsers: User[] = [];
  try {
    groupUsers = await getGroupUsersByGroupIdDeduped(groupId);
  } catch (error) {
    if (!isRequestAbortError(error)) {
      console.error('[PageDataUseCase] Failed to fetch group users:', error);
    }
  }
  const userIds = groupUsers.map((u) => u.id);

  const [accounts, transactionResult, budgets, recurringSeries, categories, periodMap] =
    await Promise.all([
      safeFetch(getAccountsByGroupDeduped(groupId), [] as Account[], 'Failed to fetch accounts'),
      safeFetch(
        getTransactionsByGroupUseCase(groupId, {
          startDate: dashboardTransactionStartDate(),
          limit: DASHBOARD_TRANSACTIONS_LIMIT,
          countTotal: false,
        }),
        { data: [] as Transaction[], total: 0, hasMore: false },
        'Failed to fetch transactions'
      ),
      safeFetch(getBudgetsByGroupUseCase(groupId), [] as Budget[], 'Failed to fetch budgets'),
      safeFetch(
        getSeriesByGroupUseCase(groupId),
        [] as RecurringTransactionSeries[],
        'Failed to fetch recurring series'
      ),
      safeFetch(getAllCategoriesDeduped(), [] as Category[], 'Failed to fetch categories'),
      safeFetch(
        getActiveBudgetPeriodsForUsersUseCase(userIds),
        {} as Record<string, BudgetPeriod | null>,
        'Failed to fetch budget periods'
      ),
    ]);

  const budgetPeriods: Record<string, BudgetPeriod | null> = {};
  userIds.forEach((userId) => {
    budgetPeriods[userId] = periodMap?.[userId] ?? null;
  });

  const budgetsByUser = enrichBudgetSummariesWithPeriodAmounts(
    buildBudgetsByUserPure(groupUsers, budgets, transactionResult.data, budgetPeriods),
    groupUsers,
    transactionResult.data,
    accounts,
    budgetPeriods
  );

  const accountBalances: Record<string, number> = {};
  accounts.forEach((a) => {
    accountBalances[a.id] = Number(a.balance) || 0;
  });

  const balanceViewModel = computeDashboardBalanceViewModel(accounts, accountBalances, userIds);

  return {
    accounts,
    transactions: transactionResult.data,
    budgetPeriods,
    recurringSeries,
    categories,
    accountBalances,
    budgetsByUser,
    balanceViewModel,
  };
}
