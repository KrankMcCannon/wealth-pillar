import type {
  Transaction,
  Budget,
  BudgetProgress,
  UserBudgetSummary,
  User,
  BudgetPeriod,
} from '@/lib/types';
import type { DateInput } from '@/lib/utils/date-utils';
import { filterTransactionsByPeriod, filterByCategories } from '../transactions/transaction.logic';
import { parsePeriodDates } from '../shared/period.logic';

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

  const periodTransactions = filterTransactionsByPeriod(transactions, periodStart, periodEnd);
  return filterByCategories(periodTransactions, budget.categories);
}

/**
 * Transactions nel periodo che ricadono nell'unione delle categorie di più budget
 * (ogni movimento conta una sola volta — utile per grafici "tutti i budget insieme").
 */
export function filterTransactionsForBudgetsUnion(
  transactions: Transaction[],
  budgets: Budget[],
  periodStart: DateInput | null,
  periodEnd: DateInput | null
): Transaction[] {
  if (!periodStart || budgets.length === 0) return [];

  const categoryKeys = new Set<string>();
  for (const budget of budgets) {
    for (const cat of budget.categories) {
      categoryKeys.add(cat);
    }
  }

  if (categoryKeys.size === 0) return [];

  const periodTransactions = filterTransactionsByPeriod(transactions, periodStart, periodEnd);
  return filterByCategories(periodTransactions, [...categoryKeys]);
}

/** Spesa effettiva da un elenco di transazioni (stessa regola dei singoli budget). */
export function effectiveSpentFromTransactions(transactions: Transaction[]): number {
  const spent = transactions.reduce((sum, t) => {
    if (t.type === 'income') {
      return sum - t.amount;
    }
    if (t.type === 'expense') {
      return sum + t.amount;
    }
    return sum;
  }, 0);
  return Math.max(0, spent);
}

/**
 * Calculate progress for a single budget
 */
export function calculateBudgetProgress(
  budget: Budget,
  transactions: Transaction[]
): BudgetProgress {
  const effectiveSpent = effectiveSpentFromTransactions(transactions);
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
 * totalSpent uses deduped union of budget category transactions (no double-count on overlap).
 */
function buildBudgetSummary(
  user: User,
  budgetProgress: BudgetProgress[],
  activePeriod: BudgetPeriod | null | undefined,
  periodStart: ReturnType<typeof parsePeriodDates>[0],
  periodEnd: ReturnType<typeof parsePeriodDates>[1],
  unionTransactions: Transaction[]
): UserBudgetSummary {
  const totalBudget = budgetProgress.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = effectiveSpentFromTransactions(unionTransactions);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return {
    user,
    budgets: budgetProgress,
    activePeriod: activePeriod || undefined,
    periodStart: periodStart.toISO() || null,
    periodEnd: periodEnd.toISO() || null,
    totalBudget,
    totalSpent,
    totalRemaining,
    overallPercentage,
  };
}

/**
 * Build complete budget summary for a user (Pure Logic)
 */
export function calculateUserBudgetSummaryPure(
  user: User,
  budgets: Budget[],
  transactions: Transaction[],
  activePeriod: BudgetPeriod | null | undefined,
  now?: Date
): UserBudgetSummary {
  const [periodStart, periodEnd] = parsePeriodDates(activePeriod, now);
  const validBudgets = budgets.filter((b) => b.amount > 0);

  const budgetProgress = calculateBudgetsWithProgress(
    budgets,
    transactions,
    periodStart,
    periodEnd
  );

  const unionTransactions = filterTransactionsForBudgetsUnion(
    transactions,
    validBudgets,
    periodStart,
    periodEnd
  );

  return buildBudgetSummary(
    user,
    budgetProgress,
    activePeriod,
    periodStart,
    periodEnd,
    unionTransactions
  );
}

/**
 * Build budgetsByUser object for all users in a group (Pure Logic)
 */
export function buildBudgetsByUserPure(
  groupUsers: User[],
  budgets: Budget[],
  transactions: Transaction[],
  budgetPeriods: Record<string, BudgetPeriod | null>,
  now?: Date
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
      activePeriod,
      now
    );
  }

  return result;
}
