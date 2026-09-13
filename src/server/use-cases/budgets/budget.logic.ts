import type {
  Transaction,
  Budget,
  BudgetProgress,
  UserBudgetSummary,
  User,
  BudgetPeriod,
  Category,
  Account,
} from '@/lib/types';
import type { DateInput } from '@/lib/utils/date-utils';
import { roundMoney } from '@/lib/utils/money';
import { filterTransactionsByPeriod, filterByCategories } from '../transactions/transaction.logic';
import { parsePeriodDates } from '../shared/period.logic';
import { getCategoryColor, getCategoryLabel } from '../categories/category.logic';
import { allocatedFromBudgets } from '../budget-periods/period-budgets.logic';
import { foldBudgetSpent } from '@/server/ledger';

export interface BudgetCategoryBreakdownItem {
  key: string;
  label: string;
  color: string;
  spent: number;
  transactionCount: number;
}

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

/** Per-category spending breakdown for a single budget (transactions already scoped to budget). */
export function buildBudgetCategoryBreakdown(
  budget: Budget,
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[] = [],
  userId?: string
): BudgetCategoryBreakdownItem[] {
  return budget.categories
    .map((key) => {
      const categoryTxs = transactions.filter((t) => t.category === key);
      return {
        key,
        label: getCategoryLabel(categories, key),
        color: getCategoryColor(categories, key),
        spent: effectiveSpentFromTransactions(categoryTxs, accounts, userId),
        transactionCount: categoryTxs.length,
      };
    })
    .filter((item) => item.spent > 0)
    .sort((a, b) => b.spent - a.spent);
}

/** Spesa effettiva da un elenco di transazioni (stessa regola dei singoli budget). */
export function effectiveSpentFromTransactions(
  transactions: Transaction[],
  accounts: Account[] = [],
  userId?: string
): number {
  return foldBudgetSpent(transactions, accounts, userId);
}

export interface PeriodBudgetRollup {
  budgetProgress: BudgetProgress[];
  allocated: number;
  spent: number;
  remaining: number;
  categorySpending: Record<string, number>;
}

function categorySpendingFromUnion(
  budgets: Budget[],
  transactions: Transaction[],
  periodStart: DateInput | null,
  periodEnd: DateInput | null,
  accounts: Account[],
  userId: string
): Record<string, number> {
  const unionTransactions = filterTransactionsForBudgetsUnion(
    transactions,
    budgets.filter((budget) => budget.amount > 0),
    periodStart,
    periodEnd
  );
  const spending: Record<string, number> = {};
  const keys = new Set(unionTransactions.map((tx) => tx.category));
  for (const key of keys) {
    const spent = effectiveSpentFromTransactions(
      unionTransactions.filter((tx) => tx.category === key),
      accounts,
      userId
    );
    if (spent > 0) spending[key] = spent;
  }
  return spending;
}

/**
 * Same rollup as active budgets: each envelope folds its own categories, and
 * period spent is the sum of those envelopes (a matching tx raises both).
 */
export function calculatePeriodBudgetRollup(
  budgets: Budget[],
  transactions: Transaction[],
  periodStart: DateInput | null,
  periodEnd: DateInput | null,
  accounts: Account[],
  userId: string
): PeriodBudgetRollup {
  const budgetProgress = calculateBudgetsWithProgress(
    budgets,
    transactions,
    periodStart,
    periodEnd,
    accounts,
    userId
  );
  const allocated = allocatedFromBudgets(budgets);
  const spent = roundMoney(budgetProgress.reduce((sum, row) => sum + row.spent, 0));
  return {
    budgetProgress,
    allocated,
    spent,
    remaining: roundMoney(allocated - spent),
    categorySpending: categorySpendingFromUnion(
      budgets,
      transactions,
      periodStart,
      periodEnd,
      accounts,
      userId
    ),
  };
}

export function calculateEnvelopePeriodTotals(
  budgets: Budget[],
  transactions: Transaction[],
  periodStart: DateInput | null,
  periodEnd: DateInput | null,
  accounts: Account[],
  userId: string
): { allocated: number; spent: number; remaining: number } {
  const { allocated, spent, remaining } = calculatePeriodBudgetRollup(
    budgets,
    transactions,
    periodStart,
    periodEnd,
    accounts,
    userId
  );
  return { allocated, spent, remaining };
}

/**
 * Calculate progress for a single budget
 */
export function calculateBudgetProgress(
  budget: Budget,
  transactions: Transaction[],
  accounts: Account[] = [],
  userId?: string
): BudgetProgress {
  const effectiveSpent = effectiveSpentFromTransactions(transactions, accounts, userId);
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
  periodEnd: DateInput | null,
  accounts: Account[] = [],
  userId?: string
): BudgetProgress[] {
  const validBudgets = budgets.filter((b) => b.amount > 0);

  return validBudgets.map((budget) => {
    const budgetTransactions = filterTransactionsForBudget(
      transactions,
      budget,
      periodStart,
      periodEnd
    );
    return calculateBudgetProgress(budget, budgetTransactions, accounts, userId ?? budget.user_id);
  });
}

/**
 * Helper to build UserBudgetSummary from computed budget progress.
 * totalSpent is the sum of envelope spent — same number as the cards.
 */
function buildBudgetSummary(
  user: User,
  budgetProgress: BudgetProgress[],
  activePeriod: BudgetPeriod | null | undefined,
  periodStart: ReturnType<typeof parsePeriodDates>[0],
  periodEnd: ReturnType<typeof parsePeriodDates>[1],
  totals: { allocated: number; spent: number; remaining: number }
): UserBudgetSummary {
  const overallPercentage = totals.allocated > 0 ? (totals.spent / totals.allocated) * 100 : 0;

  return {
    user,
    budgets: budgetProgress,
    activePeriod: activePeriod || undefined,
    periodStart: periodStart.toISO() || null,
    periodEnd: periodEnd.toISO() || null,
    totalBudget: totals.allocated,
    totalSpent: totals.spent,
    totalRemaining: totals.remaining,
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
  now?: Date,
  accounts: Account[] = []
): UserBudgetSummary {
  const [periodStart, periodEnd] = parsePeriodDates(activePeriod, now);
  const rollup = calculatePeriodBudgetRollup(
    budgets,
    transactions,
    periodStart,
    periodEnd,
    accounts,
    user.id
  );

  return buildBudgetSummary(
    user,
    rollup.budgetProgress,
    activePeriod,
    periodStart,
    periodEnd,
    rollup
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
  now?: Date,
  accounts: Account[] = []
): Record<string, UserBudgetSummary> {
  const budgetsByUserId = new Map<string, Budget[]>();
  for (const budget of budgets) {
    if (!budgetsByUserId.has(budget.user_id)) {
      budgetsByUserId.set(budget.user_id, []);
    }
    budgetsByUserId.get(budget.user_id)!.push(budget);
  }

  const result: Record<string, UserBudgetSummary> = {};

  for (const user of groupUsers) {
    const userBudgets = budgetsByUserId.get(user.id) || [];
    const activePeriod = budgetPeriods[user.id];

    result[user.id] = calculateUserBudgetSummaryPure(
      user,
      userBudgets,
      transactions,
      activePeriod,
      now,
      accounts
    );
  }

  return result;
}
