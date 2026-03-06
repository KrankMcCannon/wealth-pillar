/**
 * Transaction Impact Calculator
 *
 * Single source of truth for how transactions affect accounts, budgets, and reports.
 * All functions are pure - no side effects, no database calls.
 */

import type { Transaction } from '@/lib/types';
import type { DateInput } from '@/lib/utils/date-utils';
import { toDateTime } from '@/lib/utils/date-utils';

// ============================================================================
// TYPES
// ============================================================================

export type TransactionClassificationType =
  | 'income'
  | 'expense'
  | 'internal_transfer'
  | 'external_transfer_in'
  | 'external_transfer_out';

export interface TransactionClassification {
  readonly type: TransactionClassificationType;
  readonly amount: number;
  readonly sourceAccountId: string;
  readonly destinationAccountId: string | null;
}

export interface AccountImpact {
  readonly delta: number;
}

export interface PeriodAggregation {
  readonly totalIncome: number;
  readonly totalExpense: number;
  readonly totalTransfersIn: number;
  readonly totalTransfersOut: number;
  readonly internalTransfers: number;
  readonly netChange: number;
}

export interface BudgetAggregation {
  readonly spent: number;
  readonly income: number;
  readonly net: number;
}

// ============================================================================
// CLASSIFICATION
// ============================================================================

/**
 * Classify a transaction relative to a set of account IDs.
 *
 * Rules:
 * - income → 'income'
 * - expense → 'expense'
 * - transfer where both source and dest are in the set → 'internal_transfer'
 * - transfer where only source is in the set → 'external_transfer_out'
 * - transfer where only dest is in the set → 'external_transfer_in'
 * - transfer where neither is in the set → null (not relevant)
 */
export function classifyTransaction(
  transaction: Transaction,
  accountIds: ReadonlySet<string>
): TransactionClassification | null {
  const { type, amount, account_id, to_account_id } = transaction;

  if (type === 'income') {
    if (!accountIds.has(account_id)) return null;
    return {
      type: 'income',
      amount,
      sourceAccountId: account_id,
      destinationAccountId: null,
    };
  }

  if (type === 'expense') {
    if (!accountIds.has(account_id)) return null;
    return {
      type: 'expense',
      amount,
      sourceAccountId: account_id,
      destinationAccountId: null,
    };
  }

  // Transfer
  const isSource = accountIds.has(account_id);
  const isDest = to_account_id ? accountIds.has(to_account_id) : false;

  if (isSource && isDest) {
    return {
      type: 'internal_transfer',
      amount,
      sourceAccountId: account_id,
      destinationAccountId: to_account_id!,
    };
  }

  if (isSource) {
    return {
      type: 'external_transfer_out',
      amount,
      sourceAccountId: account_id,
      destinationAccountId: to_account_id ?? null,
    };
  }

  if (isDest) {
    return {
      type: 'external_transfer_in',
      amount,
      sourceAccountId: account_id,
      destinationAccountId: to_account_id!,
    };
  }

  return null; // Transaction doesn't involve any of the tracked accounts
}

// ============================================================================
// ACCOUNT IMPACT
// ============================================================================

/**
 * Calculate how a single transaction changes an account set's balance.
 *
 * Rules:
 * - income → +amount
 * - expense → -amount
 * - internal_transfer → 0 (money stays within the set)
 * - external_transfer_out → -amount
 * - external_transfer_in → +amount
 */
export function calculateAccountImpact(
  transaction: Transaction,
  accountIds: ReadonlySet<string>
): AccountImpact {
  const classification = classifyTransaction(transaction, accountIds);
  if (!classification) return { delta: 0 };

  switch (classification.type) {
    case 'income':
      return { delta: classification.amount };
    case 'expense':
      return { delta: -classification.amount };
    case 'internal_transfer':
      return { delta: 0 };
    case 'external_transfer_out':
      return { delta: -classification.amount };
    case 'external_transfer_in':
      return { delta: classification.amount };
  }
}

/**
 * Calculate the total balance from a list of transactions for an account set.
 * Sums all individual impacts.
 */
export function calculateBalanceFromTransactions(
  transactions: readonly Transaction[],
  accountIds: ReadonlySet<string>
): number {
  const balance = transactions.reduce((sum, t) => {
    const impact = calculateAccountImpact(t, accountIds);
    return sum + impact.delta;
  }, 0);

  return roundToTwoDecimals(balance);
}

// ============================================================================
// PERIOD AGGREGATION
// ============================================================================

/**
 * Filter transactions within a date range (inclusive on both ends).
 */
export function filterTransactionsByDateRange(
  transactions: readonly Transaction[],
  startDate: DateInput,
  endDate: DateInput | null
): Transaction[] {
  const startDt = toDateTime(startDate);
  if (!startDt) return [];
  const normalizedStart = startDt.startOf('day');

  const endDt = endDate ? toDateTime(endDate) : null;
  const normalizedEnd = endDt ? endDt.endOf('day') : null;

  return transactions.filter((t) => {
    const txDate = toDateTime(t.date);
    if (!txDate) return false;
    if (txDate < normalizedStart) return false;
    if (normalizedEnd && txDate > normalizedEnd) return false;
    return true;
  });
}

/**
 * Aggregate transactions for a period, relative to a set of account IDs.
 *
 * Returns a breakdown of income, expenses, transfers in/out, and net change.
 */
export function aggregateTransactionsForPeriod(
  transactions: readonly Transaction[],
  accountIds: ReadonlySet<string>
): PeriodAggregation {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalTransfersIn = 0;
  let totalTransfersOut = 0;
  let internalTransfers = 0;

  for (const t of transactions) {
    const classification = classifyTransaction(t, accountIds);
    if (!classification) continue;

    switch (classification.type) {
      case 'income':
        totalIncome += classification.amount;
        break;
      case 'expense':
        totalExpense += classification.amount;
        break;
      case 'internal_transfer':
        internalTransfers += classification.amount;
        break;
      case 'external_transfer_out':
        totalTransfersOut += classification.amount;
        break;
      case 'external_transfer_in':
        totalTransfersIn += classification.amount;
        break;
    }
  }

  const netChange = totalIncome - totalExpense + totalTransfersIn - totalTransfersOut;

  return {
    totalIncome: roundToTwoDecimals(totalIncome),
    totalExpense: roundToTwoDecimals(totalExpense),
    totalTransfersIn: roundToTwoDecimals(totalTransfersIn),
    totalTransfersOut: roundToTwoDecimals(totalTransfersOut),
    internalTransfers: roundToTwoDecimals(internalTransfers),
    netChange: roundToTwoDecimals(netChange),
  };
}

/**
 * Aggregate transactions filtered by date range for a period.
 * Convenience wrapper combining filter + aggregate.
 */
export function aggregateTransactionsForDateRange(
  transactions: readonly Transaction[],
  startDate: DateInput,
  endDate: DateInput | null,
  accountIds: ReadonlySet<string>
): PeriodAggregation {
  const filtered = filterTransactionsByDateRange(transactions, startDate, endDate);
  return aggregateTransactionsForPeriod(filtered, accountIds);
}

// ============================================================================
// BUDGET AGGREGATION
// ============================================================================

/**
 * Aggregate transactions for a budget.
 *
 * Only considers transactions whose category matches the budget's categories.
 *
 * Rules:
 * - expense matching category → increases spent
 * - income matching category → increases income (reduces net spent)
 * - internal transfer → no impact (money moves between user's accounts)
 * - external transfer out matching category → increases spent
 * - external transfer in matching category → increases income
 *
 * Note: For budget tracking, we use a simplified model where accountIds
 * is optional. When not provided, all expense/income transactions matching
 * the budget categories are counted regardless of account.
 */
export function aggregateTransactionsForBudget(
  transactions: readonly Transaction[],
  budgetCategories: readonly string[],
  accountIds?: ReadonlySet<string>
): BudgetAggregation {
  const categorySet = new Set(budgetCategories);
  let spent = 0;
  let income = 0;

  for (const t of transactions) {
    if (!categorySet.has(t.category)) continue;

    if (accountIds) {
      // Use full classification for transfer handling
      const classification = classifyTransaction(t, accountIds);
      if (!classification) continue;

      switch (classification.type) {
        case 'expense':
        case 'external_transfer_out':
          spent += classification.amount;
          break;
        case 'income':
        case 'external_transfer_in':
          income += classification.amount;
          break;
        case 'internal_transfer':
          // No budget impact for internal transfers
          break;
      }
    } else {
      // Simplified model: no account context
      if (t.type === 'expense') {
        spent += t.amount;
      } else if (t.type === 'income') {
        income += t.amount;
      }
      // Transfers without account context are ignored for budgets
    }
  }

  return {
    spent: roundToTwoDecimals(spent),
    income: roundToTwoDecimals(income),
    net: roundToTwoDecimals(spent - income),
  };
}

// ============================================================================
// HISTORICAL BALANCE
// ============================================================================

/**
 * Calculate historical balance by reversing transactions from current balance.
 *
 * Given the current balance and all transactions, computes what the balance
 * was at the START of the target date by reversing all transactions that
 * occurred ON or AFTER the target date.
 */
export function calculateHistoricalBalance(
  allTransactions: readonly Transaction[],
  accountIds: ReadonlySet<string>,
  currentBalance: number,
  targetDate: DateInput
): number {
  const targetDt = toDateTime(targetDate)?.startOf('day');
  if (!targetDt) return currentBalance;

  // Get transactions on or after target date
  const futureTransactions = allTransactions.filter((t) => {
    const tDate = toDateTime(t.date);
    return tDate && tDate >= targetDt;
  });

  // Reverse their impact
  const futureImpact = aggregateTransactionsForPeriod(futureTransactions, accountIds);
  return roundToTwoDecimals(currentBalance - futureImpact.netChange);
}

// ============================================================================
// OVERVIEW METRICS (for dashboard)
// ============================================================================

export interface OverviewMetrics {
  readonly totalEarned: number;
  readonly totalSpent: number;
  readonly totalTransferred: number;
  readonly totalBalance: number;
}

/**
 * Calculate overview metrics for a set of transactions.
 *
 * - totalEarned = income + external transfers in
 * - totalSpent = expenses + external transfers out
 * - totalTransferred = all transfer amounts where user is source
 * - totalBalance = totalEarned - totalSpent
 */
export function calculateOverviewMetrics(
  transactions: readonly Transaction[],
  accountIds: ReadonlySet<string>,
  userId?: string
): OverviewMetrics {
  const filtered = userId ? transactions.filter((t) => t.user_id === userId) : transactions;
  const aggregation = aggregateTransactionsForPeriod(filtered, accountIds);

  const totalEarned = aggregation.totalIncome + aggregation.totalTransfersIn;
  const totalSpent = aggregation.totalExpense + aggregation.totalTransfersOut;

  // totalTransferred counts all outgoing transfers (including internal)
  let totalTransferred = 0;
  for (const t of filtered) {
    if (t.type !== 'transfer') continue;
    if (accountIds.has(t.account_id)) {
      totalTransferred += t.amount;
    }
  }

  return {
    totalEarned: roundToTwoDecimals(totalEarned),
    totalSpent: roundToTwoDecimals(totalSpent),
    totalTransferred: roundToTwoDecimals(totalTransferred),
    totalBalance: roundToTwoDecimals(totalEarned - totalSpent),
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Normalize account IDs input to a ReadonlySet.
 * Accepts a single string, an array, or a Set.
 */
export function toAccountIdSet(
  input: string | readonly string[] | ReadonlySet<string> | Set<string>
): ReadonlySet<string> {
  if (typeof input === 'string') return new Set([input]);
  if (input instanceof Set) return input;
  if (Array.isArray(input)) return new Set(input);
  // ReadonlySet that isn't a Set instance - convert to Set
  return new Set(input);
}
