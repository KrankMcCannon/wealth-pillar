import { getActiveBudgetPeriodsForUsersUseCase } from '../budget-periods/get-active-budget-periods-for-users.use-case';
import { getSeriesByGroupUseCase } from '../recurring/recurring.use-cases';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
  getGroupUsersByGroupIdDeduped,
} from '@/server/request-cache/services';
import { getTransactionsByGroupUseCase } from '../transactions/get-transactions.use-case';
import { getBudgetsByGroupUseCase } from '../budgets/get-budgets.use-case';
import { buildBudgetsByUserPure } from '../budgets/budget.logic';
import { getPortfolioUseCase, type PortfolioResult } from '../investments/investment.use-cases';
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
  budgets: Budget[];
  budgetPeriods: Record<string, BudgetPeriod | null>;
  recurringSeries: RecurringTransactionSeries[];
  categories: Category[];
  accountBalances: Record<string, number>;
  budgetsByUser: Record<string, UserBudgetSummary>;
  investments: Record<string, PortfolioResult | null>;
}

export interface GetDashboardPageDataOptions {
  /** Home non usa il portfolio: evita N fetch investimenti. Default true per compatibilità futura. */
  includeInvestments?: boolean;
}

/**
 * Fetch all data for the dashboard page
 */
export async function getDashboardPageData(
  groupId: string,
  options?: GetDashboardPageDataOptions
): Promise<DashboardPageData> {
  const includeInvestments = options?.includeInvestments ?? true;

  // 1. Get group users first
  let groupUsers: User[] = [];
  try {
    groupUsers = await getGroupUsersByGroupIdDeduped(groupId);
  } catch (error) {
    if (!isRequestAbortError(error)) {
      console.error('[PageDataUseCase] Failed to fetch group users:', error);
    }
  }
  const userIds = groupUsers.map((u) => u.id);

  if (!includeInvestments) {
    const [accounts, transactionResult, budgets, recurringSeries, categories, periodMap] =
      await Promise.all([
        safeFetch(getAccountsByGroupDeduped(groupId), [] as Account[], 'Failed to fetch accounts'),
        safeFetch(
          getTransactionsByGroupUseCase(groupId),
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
    const investments: Record<string, PortfolioResult | null> = {};
    userIds.forEach((userId) => {
      budgetPeriods[userId] = periodMap?.[userId] ?? null;
      investments[userId] = null;
    });

    const budgetsByUser = buildBudgetsByUserPure(
      groupUsers,
      budgets,
      transactionResult.data,
      budgetPeriods
    );

    const accountBalances: Record<string, number> = {};
    accounts.forEach((a) => {
      accountBalances[a.id] = Number(a.balance) || 0;
    });

    return {
      accounts,
      transactions: transactionResult.data,
      budgets,
      budgetPeriods,
      recurringSeries,
      categories,
      accountBalances,
      budgetsByUser,
      investments,
    };
  }

  const investmentPromises = groupUsers.map((u) =>
    safeFetch<PortfolioResult | null>(
      getPortfolioUseCase(u.id),
      null,
      `Failed to fetch investments for user ${u.id}`
    )
  );

  const [
    accounts,
    transactionResult,
    budgets,
    recurringSeries,
    categories,
    periodMap,
    investmentResults,
  ] = await Promise.all([
    safeFetch(getAccountsByGroupDeduped(groupId), [] as Account[], 'Failed to fetch accounts'),
    safeFetch(
      getTransactionsByGroupUseCase(groupId),
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
    Promise.all(investmentPromises),
  ]);

  const budgetPeriods: Record<string, BudgetPeriod | null> = {};
  const investments: Record<string, PortfolioResult | null> = {};

  userIds.forEach((userId, index) => {
    const period = periodMap?.[userId] ?? null;
    budgetPeriods[userId] = period;
    investments[userId] = investmentResults?.[index] || null;
  });

  const budgetsByUser = buildBudgetsByUserPure(
    groupUsers,
    budgets,
    transactionResult.data,
    budgetPeriods
  );

  const accountBalances: Record<string, number> = {};
  accounts.forEach((a) => {
    accountBalances[a.id] = Number(a.balance) || 0;
  });

  return {
    accounts,
    transactions: transactionResult.data,
    budgets,
    budgetPeriods,
    recurringSeries,
    categories,
    accountBalances,
    budgetsByUser,
    investments,
  };
}
