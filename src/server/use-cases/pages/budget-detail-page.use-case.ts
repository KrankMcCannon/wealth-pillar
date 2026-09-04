import { cacheLife, cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { getBudgetByIdUseCase } from '../budgets/get-budgets.use-case';
import { getActiveBudgetPeriodUseCase } from '../budget-periods/get-active-budget-period.use-case';
import { getTransactionsByUserUseCase } from '../transactions/get-transactions.use-case';
import {
  getAllCategoriesDeduped,
  getAccountsByGroupDeduped,
} from '@/server/request-cache/services';
import {
  filterTransactionsForBudget,
  calculateBudgetProgress,
  buildBudgetCategoryBreakdown,
} from '../budgets/budget.logic';
import type { GroupedBudgetTransaction } from '../budgets/budget-chart.logic';
import { toDateTime } from '@/lib/utils/date-utils';
import { parsePeriodDates } from '../shared/period.logic';
import type { Account, Budget, Category, Transaction, User } from '@/lib/types';
import type { BudgetDetailPageData } from './budget-detail-page.types';
import { scopeBudgetDetailPageData } from '@/server/permissions/scope-page-data';
import { BUDGET_DETAIL_TX_PREVIEW } from '@/server/db/query-limits';

export type { BudgetDetailPageData } from './budget-detail-page.types';

function groupTransactionsByDay(transactions: Transaction[]): GroupedBudgetTransaction[] {
  const groupedMap: Record<string, Transaction[]> = {};
  for (const transaction of transactions) {
    const dateKey =
      typeof transaction.date === 'string'
        ? (transaction.date.split('T')[0] ?? transaction.date)
        : String(transaction.date);
    if (!groupedMap[dateKey]) groupedMap[dateKey] = [];
    groupedMap[dateKey].push(transaction);
  }

  return Object.entries(groupedMap)
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .map(([date, txs]) => ({
      date,
      transactions: [...txs].sort((a, b) => {
        const dtA = toDateTime(a.date);
        const dtB = toDateTime(b.date);
        if (!dtA || !dtB) return 0;
        return dtB.toMillis() - dtA.toMillis();
      }),
      total: txs.reduce((sum, tx) => {
        if (tx.type === 'income') return sum - tx.amount;
        if (tx.type === 'expense') return sum + tx.amount;
        return sum;
      }, 0),
    }));
}

export function previewGroupedBudgetTransactions(
  groups: GroupedBudgetTransaction[],
  maxTransactions: number
): GroupedBudgetTransaction[] {
  if (maxTransactions <= 0) return [];
  const preview: GroupedBudgetTransaction[] = [];
  let remaining = maxTransactions;
  for (const group of groups) {
    if (remaining <= 0) break;
    if (group.transactions.length <= remaining) {
      preview.push(group);
      remaining -= group.transactions.length;
      continue;
    }
    preview.push({
      ...group,
      transactions: group.transactions.slice(0, remaining),
    });
    break;
  }
  return preview;
}

function slimDetailPayload(
  accounts: Account[],
  categories: Category[],
  budget: Budget,
  budgetTransactions: Transaction[]
): { accounts: Account[]; categories: Category[] } {
  const categoryKeys = new Set(budget.categories);
  const accountIds = new Set(
    budgetTransactions.flatMap(
      (tx) => [tx.account_id, tx.to_account_id].filter(Boolean) as string[]
    )
  );
  return {
    categories: categories.filter(
      (c) => categoryKeys.has(c.key) || categoryKeys.has(c.id) || categoryKeys.has(c.label)
    ),
    accounts: accounts.filter((a) => accountIds.has(a.id)),
  };
}

async function getCachedBudgetDetailPageData(
  groupId: string,
  budgetId: string
): Promise<BudgetDetailPageData> {
  'use cache';
  cacheLife('minutes');
  cacheTag(`group:${groupId}:budgets`);
  cacheTag(`group:${groupId}:transactions`);
  cacheTag(`group:${groupId}:accounts`);
  cacheTag('categories');

  let budget: Budget;
  try {
    budget = await getBudgetByIdUseCase(budgetId);
  } catch {
    notFound();
  }

  if (budget.group_id !== groupId) {
    notFound();
  }

  const activePeriod = await getActiveBudgetPeriodUseCase(budget.user_id).catch(() => null);
  const [periodStart, periodEnd] = parsePeriodDates(activePeriod);
  const txOptions: {
    startDate?: Date;
    endDate?: Date;
    categoryKeys?: string[];
  } = {
    startDate: periodStart.toJSDate(),
    endDate: periodEnd.toJSDate(),
    ...(budget.categories.length > 0 ? { categoryKeys: budget.categories } : {}),
  };

  const [accounts, categories, userTransactions] = await Promise.all([
    getAccountsByGroupDeduped(groupId).catch(() => [] as Account[]),
    getAllCategoriesDeduped().catch(() => [] as Category[]),
    getTransactionsByUserUseCase(budget.user_id, txOptions).catch(() => [] as Transaction[]),
  ]);

  const budgetTransactions = filterTransactionsForBudget(
    userTransactions,
    budget,
    periodStart,
    periodEnd
  );
  const progress = calculateBudgetProgress(budget, budgetTransactions);
  const categoryBreakdown = buildBudgetCategoryBreakdown(budget, budgetTransactions, categories);
  const groupedTransactions = previewGroupedBudgetTransactions(
    groupTransactionsByDay(budgetTransactions),
    BUDGET_DETAIL_TX_PREVIEW
  );
  const slim = slimDetailPayload(accounts, categories, budget, budgetTransactions);

  return {
    budget,
    progress,
    activePeriod,
    periodStart: periodStart.toISO() ?? null,
    periodEnd: periodEnd.toISO() ?? null,
    categoryBreakdown,
    groupedTransactions,
    accounts: slim.accounts,
    categories: slim.categories,
  };
}

export async function getBudgetDetailPageData(
  groupId: string,
  budgetId: string,
  currentUser: User
): Promise<BudgetDetailPageData> {
  try {
    const data = await getCachedBudgetDetailPageData(groupId, budgetId);
    return scopeBudgetDetailPageData(data, currentUser);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }
}
