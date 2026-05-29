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
import type { Account, Budget, Category, Transaction } from '@/lib/types';
import type { BudgetDetailPageData } from './budget-detail-page.types';

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

export async function getBudgetDetailPageData(
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

  const [activePeriod, accounts, categories] = await Promise.all([
    getActiveBudgetPeriodUseCase(budget.user_id).catch(() => null),
    getAccountsByGroupDeduped(groupId).catch(() => [] as Account[]),
    getAllCategoriesDeduped().catch(() => [] as Category[]),
  ]);

  const [periodStart, periodEnd] = parsePeriodDates(activePeriod);
  const txOptions: { startDate?: Date; endDate?: Date } = {
    startDate: periodStart.toJSDate(),
    endDate: periodEnd.toJSDate(),
  };

  const userTransactions = await getTransactionsByUserUseCase(budget.user_id, txOptions).catch(
    () => [] as Transaction[]
  );

  const budgetTransactions = filterTransactionsForBudget(
    userTransactions,
    budget,
    periodStart,
    periodEnd
  );
  const progress = calculateBudgetProgress(budget, budgetTransactions);
  const categoryBreakdown = buildBudgetCategoryBreakdown(budget, budgetTransactions, categories);
  const groupedTransactions = groupTransactionsByDay(budgetTransactions);

  return {
    budget,
    progress,
    activePeriod,
    periodStart: periodStart.toISO() ?? null,
    periodEnd: periodEnd.toISO() ?? null,
    categoryBreakdown,
    groupedTransactions,
    accounts,
    categories,
  };
}
