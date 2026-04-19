import type {
  Transaction,
  Budget,
  BudgetProgress,
  UserBudgetSummary,
  User,
  BudgetPeriod,
} from '@/lib/types';
import { toDateTime } from '@/lib/utils';
import { DateTime } from 'luxon';
import type { DateInput } from '@/lib/utils/date-utils';
import { filterTransactionsByPeriod, filterByCategories } from '../transactions/transaction.logic';

/**
 * Filter transactions that belong to a specific budget
 */
export function filterTransactionsForBudget(
  transactions: Transaction[],
  budget: Budget,
  periodStart: DateInput | null,
  periodEnd: DateInput | null
): Transaction[] {
  if (!periodStart) return [];

  // 1. Filter by period using transaction logic
  const periodTransactions = filterTransactionsByPeriod(transactions, periodStart, periodEnd);

  // 2. Filter by budget categories
  return filterByCategories(periodTransactions, budget.categories);
}

/**
 * Calculate progress for a single budget
 */
export function calculateBudgetProgress(
  budget: Budget,
  transactions: Transaction[]
): BudgetProgress {
  // Calculate spent: expenses and transfers add to spent, income subtracts
  const spent = transactions.reduce((sum, t) => {
    if (t.type === 'income') {
      return sum - t.amount; // Income refills budget
    }
    return sum + t.amount; // Expense and transfer consume budget
  }, 0);

  const effectiveSpent = Math.max(0, spent);
  const remaining = budget.amount - effectiveSpent;
  const percentage = budget.amount > 0 ? (effectiveSpent / budget.amount) * 100 : 0;

  return {
    id: budget.id,
    description: budget.description,
    amount: budget.amount,
    spent: effectiveSpent,
    remaining,
    percentage,
    categories: budget.categories,
    transactionCount: transactions.length,
  };
}

/**
 * Calculate progress for multiple budgets
 */
export function calculateBudgetsWithProgress(
  budgets: Budget[],
  transactions: Transaction[],
  periodStart: DateInput | null,
  periodEnd: DateInput | null
): BudgetProgress[] {
  const validBudgets = budgets.filter((b) => b.amount > 0);

  return validBudgets.map((budget) => {
    const budgetTransactions = filterTransactionsForBudget(
      transactions,
      budget,
      periodStart,
      periodEnd
    );
    return calculateBudgetProgress(budget, budgetTransactions);
  });
}

/**
 * Helper to build UserBudgetSummary from computed budget progress.
 */
function buildBudgetSummary(
  user: User,
  budgetProgress: BudgetProgress[],
  activePeriod: BudgetPeriod | null | undefined,
  periodStart: DateTime | null,
  periodEnd: DateTime | null
): UserBudgetSummary {
  const totalBudget = budgetProgress.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgetProgress.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return {
    user,
    budgets: budgetProgress,
    activePeriod: activePeriod || undefined,
    periodStart: periodStart?.toISO() || null,
    periodEnd: periodEnd?.toISO() || null,
    totalBudget,
    totalSpent,
    totalRemaining,
    overallPercentage,
  };
}

/**
 * Parse period dates from an active budget period.
 */
function parsePeriodDates(
  activePeriod: BudgetPeriod | null | undefined
): [DateTime | null, DateTime | null] {
  const periodStart = activePeriod ? toDateTime(activePeriod.start_date) : null;
  const periodEnd = activePeriod?.end_date
    ? (toDateTime(activePeriod.end_date)?.endOf('day') ?? null)
    : null;
  return [periodStart, periodEnd];
}

/**
 * Build complete budget summary for a user (Pure Logic)
 */
export function calculateUserBudgetSummaryPure(
  user: User,
  budgets: Budget[],
  transactions: Transaction[],
  activePeriod: BudgetPeriod | null | undefined
): UserBudgetSummary {
  const [periodStart, periodEnd] = parsePeriodDates(activePeriod);

  const budgetProgress = calculateBudgetsWithProgress(
    budgets,
    transactions,
    periodStart,
    periodEnd
  );

  return buildBudgetSummary(user, budgetProgress, activePeriod, periodStart, periodEnd);
}

/**
 * Build complete budget summary for a user using AGGREGATED data
 */
export function calculateUserBudgetSummaryFromAggregation(
  user: User,
  budgets: Budget[],
  spendingData: Array<{ category: string; spent: number; income: number }>,
  activePeriod: BudgetPeriod | null | undefined
): UserBudgetSummary {
  const [periodStart, periodEnd] = parsePeriodDates(activePeriod);

  // Create a map for faster O(1) category lookup
  const spendingMap = new Map<string, { spent: number; income: number }>();
  for (const item of spendingData) {
    spendingMap.set(item.category, { spent: item.spent, income: item.income });
  }

  // Calculate progress for each valid budget
  const budgetProgress: BudgetProgress[] = budgets
    .filter((b) => b.amount > 0)
    .map((budget) => {
      // Sum net spending for all categories in this budget
      let budgetSpent = 0;
      for (const cat of budget.categories) {
        const data = spendingMap.get(cat);
        if (data) {
          // Net Spent = (Expense + Outgoing Transfer) - Income
          budgetSpent += data.spent - data.income;
        }
      }

      const effectiveSpent = Math.max(0, budgetSpent);
      const remaining = budget.amount - effectiveSpent;
      const percentage = budget.amount > 0 ? (effectiveSpent / budget.amount) * 100 : 0;

      return {
        id: budget.id,
        description: budget.description,
        amount: budget.amount,
        spent: effectiveSpent,
        remaining,
        percentage,
        categories: budget.categories,
        transactionCount: 0, // Not available from aggregated data
      };
    });

  return buildBudgetSummary(user, budgetProgress, activePeriod, periodStart, periodEnd);
}

/**
 * Build budgetsByUser object for all users in a group (Pure Logic)
 */
export function buildBudgetsByUserPure(
  groupUsers: User[],
  budgets: Budget[],
  transactions: Transaction[],
  budgetPeriods: Record<string, BudgetPeriod | null>
): Record<string, UserBudgetSummary> {
  const budgetsByUserId = new Map<string, Budget[]>();
  for (const budget of budgets) {
    if (!budgetsByUserId.has(budget.user_id)) {
      budgetsByUserId.set(budget.user_id, []);
    }
    budgetsByUserId.get(budget.user_id)!.push(budget);
  }

  const transactionsByUserId = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    const userId = transaction.user_id;
    if (!userId) continue;
    if (!transactionsByUserId.has(userId)) {
      transactionsByUserId.set(userId, []);
    }
    transactionsByUserId.get(userId)!.push(transaction);
  }

  const result: Record<string, UserBudgetSummary> = {};

  for (const user of groupUsers) {
    const userBudgets = budgetsByUserId.get(user.id) || [];
    const userTransactions = transactionsByUserId.get(user.id) || [];
    const activePeriod = budgetPeriods[user.id];

    result[user.id] = calculateUserBudgetSummaryPure(
      user,
      userBudgets,
      userTransactions,
      activePeriod
    );
  }

  return result;
}
