import { financialDateKey } from '@/lib/utils/financial-date';
import { CACHE_TAGS } from '@/lib/cache/config';
import type { Account, Budget, Category, Transaction, User } from '@/lib/types';
import { toDateTime } from '@/lib/utils/date-utils';
import { BUDGET_DETAIL_TX_PREVIEW } from '@/server/db/query-limits';
import { scopeBudgetDetailPageData } from '@/server/permissions/scope-page-data';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
} from '@/server/request-cache/services';
import { cacheLife, cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { getActiveBudgetPeriodUseCase } from '../budget-periods/get-active-budget-period.use-case';
import type { GroupedBudgetTransaction } from '../budgets/budget-chart.logic';
import {
  buildBudgetCategoryBreakdown,
  calculateBudgetProgress,
  filterTransactionsForBudget,
} from '../budgets/budget.logic';
import { getBudgetByIdUseCase } from '../budgets/get-budgets.use-case';
import { parsePeriodDates } from '../shared/period.logic';
import { accountsToMap, budgetSignedForUser, transactionInvolvesUser } from '@/server/ledger';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { ledgerRowCount } from '@/server/ledger/aggregate';
import type { BudgetDetailPageData } from './budget-detail-page.types';

export type { BudgetDetailPageData } from './budget-detail-page.types';

function groupTransactionsByDay(
  transactions: Transaction[],
  accounts: Account[],
  userId: string
): GroupedBudgetTransaction[] {
  const groupedMap: Record<string, Transaction[]> = {};
  const accountMap = accountsToMap(accounts);
  for (const transaction of transactions) {
    const dateKey = financialDateKey(transaction.date);
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
      total: txs.reduce((sum, tx) => sum - budgetSignedForUser(tx, accountMap, userId), 0),
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
      isPartial: true,
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
  cacheTag(CACHE_TAGS.BUDGET_PERIODS);
  cacheTag(`group:${groupId}:categories`, `group:00000000-0000-0000-0000-000000000000:categories`);

  let budget: Budget;
  try {
    budget = await getBudgetByIdUseCase(budgetId);
  } catch {
    notFound();
  }

  if (budget.group_id !== groupId) {
    notFound();
  }

  cacheTag(CACHE_TAGS.USER_BUDGET_PERIODS(budget.user_id));
  const activePeriod = await getActiveBudgetPeriodUseCase(budget.user_id);
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

  const [accounts, categories, groupTransactions] = await Promise.all([
    getAccountsByGroupDeduped(groupId),
    getAllCategoriesDeduped(groupId),
    TransactionsRepository.aggregateByGroup(groupId, txOptions),
  ]);

  const userTransactions = groupTransactions.filter((tx) =>
    transactionInvolvesUser(tx, budget.user_id, accounts)
  );

  const budgetTransactions = filterTransactionsForBudget(
    userTransactions,
    budget,
    periodStart,
    periodEnd
  );
  const progress = calculateBudgetProgress(budget, budgetTransactions, accounts, budget.user_id);
  const categoryBreakdown = buildBudgetCategoryBreakdown(
    budget,
    budgetTransactions,
    categories,
    accounts,
    budget.user_id
  );
  const preview: Transaction[] = [];
  for await (const page of TransactionsRepository.scanByGroup(groupId, txOptions)) {
    for (const row of page) {
      const transaction = { ...row, amount: Number(row.amount) } as Transaction;
      if (
        transactionInvolvesUser(transaction, budget.user_id, accounts) &&
        budget.categories.includes(transaction.category)
      )
        preview.push(transaction);
      if (preview.length > BUDGET_DETAIL_TX_PREVIEW) break;
    }
    if (preview.length > BUDGET_DETAIL_TX_PREVIEW) break;
  }
  const groupedTransactions = previewGroupedBudgetTransactions(
    groupTransactionsByDay(preview, accounts, budget.user_id),
    BUDGET_DETAIL_TX_PREVIEW
  ).map((group) => ({
    ...group,
    total: budgetTransactions
      .filter((tx) => financialDateKey(tx.date) === group.date)
      .reduce(
        (sum, tx) => sum - budgetSignedForUser(tx, accountsToMap(accounts), budget.user_id),
        0
      ),
  }));
  const slim = slimDetailPayload(accounts, categories, budget, budgetTransactions);

  return {
    transactionCount: ledgerRowCount(budgetTransactions),
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
