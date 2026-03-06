/**
 * Finance Logic Service
 *
 * Delegates core financial calculations to TransactionImpactCalculator.
 * Keeps category, budget summary, and convenience wrappers.
 */

import type {
  Transaction,
  CategoryBreakdownItem,
  Budget,
  BudgetProgress,
  UserBudgetSummary,
  User,
  BudgetPeriod,
  Account,
  Category,
  RecurringTransactionSeries,
} from '@/lib/types';
import { toDateTime } from '@/lib/utils';
import { DateTime } from 'luxon';
import type { DateInput } from '@/lib/utils/date-utils';
import { CATEGORY_COLOR_PALETTE, DEFAULT_CATEGORY_COLOR } from '@/features/categories/constants';
import {
  filterTransactionsByDateRange,
  aggregateTransactionsForPeriod,
  aggregateTransactionsForBudget,
  calculateBalanceFromTransactions,
  calculateHistoricalBalance as calcHistoricalBalance,
  calculateOverviewMetrics as calcOverviewMetrics,
  toAccountIdSet,
  // Recurring series (delegated to standalone module)
  calculateNextExecutionDate as calcNextExecDate,
  calculateDaysUntilDue as calcDaysUntilDue,
  isSeriesDue as checkSeriesDue,
  getFrequencyLabel as getFreqLabel,
  formatDueDate as fmtDueDate,
  groupSeriesByUser as grpSeriesByUser,
  calculateMonthlyAmount as calcMonthlyAmt,
  calculateRecurringTotals,
  hasSeriesAccess,
  getSeriesAssociatedUsers,
} from './calculation';

export type { OverviewMetrics } from './calculation';

export class FinanceLogicService {
  /**
   * Filter transactions within a date range
   */
  static filterTransactionsByPeriod(
    transactions: Transaction[],
    startDate: DateInput,
    endDate: DateInput
  ): Transaction[] {
    return filterTransactionsByDateRange(transactions, startDate, endDate);
  }

  /**
   * Calculate overall metrics
   */
  static calculateOverviewMetrics(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): import('./calculation').OverviewMetrics {
    return calcOverviewMetrics(transactions, new Set(userAccountIds), userId);
  }

  /**
   * Calculate category breakdown with NET analysis
   * @complexity O(n + m log m)
   */
  static calculateCategoryBreakdown(transactions: Transaction[]): CategoryBreakdownItem[] {
    if (transactions.length === 0) return [];
    const categoryMap = new Map<string, { spent: number; received: number; count: number }>();

    for (const t of transactions) {
      if (t.type === 'transfer') continue;
      const existing = categoryMap.get(t.category) || { spent: 0, received: 0, count: 0 };
      if (t.type === 'expense') {
        existing.spent += t.amount;
        existing.count += 1;
      } else if (t.type === 'income') {
        existing.received += t.amount;
        existing.count += 1;
      }
      categoryMap.set(t.category, existing);
    }

    const breakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      spent: data.spent,
      received: data.received,
      net: data.spent - data.received,
      percentage: 0,
      count: data.count,
    }));

    const totalNetSpending = breakdown
      .filter((item) => item.net > 0)
      .reduce((sum, item) => sum + item.net, 0);

    for (const item of breakdown) {
      item.percentage =
        item.net > 0 && totalNetSpending > 0 ? (item.net / totalNetSpending) * 100 : 0;
    }

    return breakdown.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }

  /**
   * Filter transactions by categories
   * @complexity O(n)
   */
  static filterByCategories(transactions: Transaction[], categories: string[]): Transaction[] {
    const categorySet = new Set(categories);
    return transactions.filter((t) => categorySet.has(t.category));
  }

  /**
   * Calculate historical balance for a specific account
   * Reverses transactions from current balance back to target date
   */
  static calculateHistoricalBalance(
    allTransactions: Transaction[],
    accountIds: string | Set<string>,
    currentBalance: number,
    targetDate: DateInput
  ): number {
    return calcHistoricalBalance(
      allTransactions,
      toAccountIdSet(accountIds),
      currentBalance,
      targetDate
    );
  }

  /**
   * Calculate total spent (expenses + outgoing transfers) for an account in a period
   */
  static calculatePeriodTotalSpent(
    periodTransactions: Transaction[],
    accountIds: string | Set<string>
  ): number {
    const agg = aggregateTransactionsForPeriod(periodTransactions, toAccountIdSet(accountIds));
    return agg.totalExpense + agg.totalTransfersOut;
  }

  /**
   * Calculate total income (income + incoming transfers) for an account in a period
   */
  static calculatePeriodTotalIncome(
    periodTransactions: Transaction[],
    accountIds: string | Set<string>
  ): number {
    const agg = aggregateTransactionsForPeriod(periodTransactions, toAccountIdSet(accountIds));
    return agg.totalIncome + agg.totalTransfersIn;
  }

  /**
   * Calculate total transfers (absolute sum of IN and OUT) for a specific account
   */
  static calculatePeriodTotalTransfers(
    periodTransactions: Transaction[],
    accountIds: string | Set<string>
  ): number {
    const agg = aggregateTransactionsForPeriod(periodTransactions, toAccountIdSet(accountIds));
    return agg.totalTransfersIn + agg.totalTransfersOut + agg.internalTransfers;
  }

  /**
   * Calculate annual category spending
   * Returns category breakdown for the current year, specified year, or all time
   *
   * @param allTransactions - All transactions to analyze
   * @param year - Year to filter by, or 'all' for all-time data
   * @complexity O(n)
   */
  static calculateAnnualCategorySpending(
    allTransactions: Transaction[],
    year: number | 'all' = new Date().getFullYear()
  ): CategoryBreakdownItem[] {
    // If 'all', use all transactions without filtering
    if (year === 'all') {
      return this.calculateCategoryBreakdown(allTransactions);
    }

    // Otherwise filter by specific year
    const annualTransactions = allTransactions.filter((t) => {
      const dt = toDateTime(t.date);
      return dt?.year === year;
    });

    return this.calculateCategoryBreakdown(annualTransactions);
  }

  // --- BUDGET LOGIC ---

  /**
   * Filter transactions that belong to a specific budget
   */
  static filterTransactionsForBudget(
    transactions: Transaction[],
    budget: Budget,
    periodStart: DateInput | null,
    periodEnd: DateInput | null
  ): Transaction[] {
    if (!periodStart) return [];

    // 1. Filter by period
    const periodTransactions = this.filterTransactionsByPeriod(
      transactions,
      periodStart,
      periodEnd
    );

    // 2. Filter by budget categories
    return this.filterByCategories(periodTransactions, budget.categories);
  }

  /**
   * Calculate progress for a single budget
   */
  static calculateBudgetProgress(budget: Budget, transactions: Transaction[]): BudgetProgress {
    const agg = aggregateTransactionsForBudget(transactions, budget.categories);
    const effectiveSpent = Math.max(0, agg.net);
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
  static calculateBudgetsWithProgress(
    budgets: Budget[],
    transactions: Transaction[],
    periodStart: DateInput | null,
    periodEnd: DateInput | null
  ): BudgetProgress[] {
    const validBudgets = budgets.filter((b) => b.amount > 0);

    return validBudgets.map((budget) => {
      const budgetTransactions = this.filterTransactionsForBudget(
        transactions,
        budget,
        periodStart,
        periodEnd
      );
      return this.calculateBudgetProgress(budget, budgetTransactions);
    });
  }

  /**
   * Private helper to build UserBudgetSummary from computed budget progress.
   */
  private static buildBudgetSummary(
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
   * @returns Tuple of [periodStart, periodEnd] as DateTime or null
   */
  private static parsePeriodDates(
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
  static calculateUserBudgetSummaryPure(
    user: User,
    budgets: Budget[],
    transactions: Transaction[],
    activePeriod: BudgetPeriod | null | undefined
  ): UserBudgetSummary {
    const [periodStart, periodEnd] = this.parsePeriodDates(activePeriod);

    const budgetProgress = this.calculateBudgetsWithProgress(
      budgets,
      transactions,
      periodStart,
      periodEnd
    );

    return this.buildBudgetSummary(user, budgetProgress, activePeriod, periodStart, periodEnd);
  }

  /**
   * Build complete budget summary for a user using AGGREGATED data
   */
  static calculateUserBudgetSummaryFromAggregation(
    user: User,
    budgets: Budget[],
    spendingData: Array<{ category: string; spent: number; income: number }>,
    activePeriod: BudgetPeriod | null | undefined
  ): UserBudgetSummary {
    const [periodStart, periodEnd] = this.parsePeriodDates(activePeriod);

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

    return this.buildBudgetSummary(user, budgetProgress, activePeriod, periodStart, periodEnd);
  }

  /**
   * Build budgetsByUser object for all users in a group (Pure Logic)
   */
  static buildBudgetsByUserPure(
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
      // If transactions are not filtered by user in the input map, filter them now if needed?
      // Actually the loop above filters them.

      // If budgetPeriods is missing a user, passed as undefined/null, handled in calculateUserBudgetSummaryPure
      const activePeriod = budgetPeriods[user.id];

      result[user.id] = this.calculateUserBudgetSummaryPure(
        user,
        userBudgets,
        userTransactions,
        activePeriod
      );
    }

    return result;
  }

  // --- ACCOUNT PURE LOGIC ---

  /**
   * Get default accounts for users (Pure business logic)
   */
  static getDefaultAccounts(
    accounts: Account[],
    users: Array<{ id: string; default_account_id?: string | null }>
  ): Account[] {
    // Get all default account IDs from users (filter out null and undefined)
    const defaultAccountIds = new Set(
      users
        .map((user) => user.default_account_id)
        .filter((id): id is string => id !== null && id !== undefined)
    );

    // Filter accounts to only include default accounts
    return accounts.filter((account) => defaultAccountIds.has(account.id));
  }

  /**
   * Calculate aggregated balance from a list of accounts
   * Uses the 'balance' field from the database
   */
  static calculateAggregatedBalance(accounts: Account[]): number {
    return accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  }

  /**
   * Calculate account balance from transactions (Pure business logic)
   */
  static calculateAccountBalance(
    accountIds: string | Set<string>,
    transactions: Transaction[]
  ): number {
    return calculateBalanceFromTransactions(transactions, toAccountIdSet(accountIds));
  }

  // --- CATEGORY PURE LOGIC ---

  /**
   * Finds a category by ID, key, or label
   */
  static findCategory(categories: Category[], identifier: string): Category | undefined {
    return categories.find(
      (c) =>
        c.id === identifier ||
        c.key === identifier ||
        c.label.toLowerCase() === identifier.toLowerCase()
    );
  }

  /**
   * Gets category color by identifier
   */
  static getCategoryColor(categories: Category[], identifier: string): string {
    const category = this.findCategory(categories, identifier);
    return category?.color || '#6B7280'; // Default gray color
  }

  /**
   * Gets category icon by identifier
   */
  static getCategoryIcon(categories: Category[], identifier: string): string {
    const category = this.findCategory(categories, identifier);
    return category?.icon || 'default';
  }

  /**
   * Gets category label by identifier
   */
  static getCategoryLabel(categories: Category[], identifier: string): string {
    const category = this.findCategory(categories, identifier);
    return category?.label || identifier;
  }

  /**
   * Gets the color palette for category selection
   */
  static getColorPalette() {
    return CATEGORY_COLOR_PALETTE;
  }

  /**
   * Validates a hex color code
   */
  static isValidColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  /**
   * Gets default category color
   */
  static getDefaultColor(): string {
    return DEFAULT_CATEGORY_COLOR;
  }

  // --- RECURRING SERIES LOGIC (delegated to calculation/recurring-series.ts) ---

  static calculateNextExecutionDate(series: RecurringTransactionSeries): string {
    return calcNextExecDate(series);
  }

  static calculateDaysUntilDue(series: RecurringTransactionSeries): number {
    return calcDaysUntilDue(series);
  }

  static isSeriesDue(series: RecurringTransactionSeries): boolean {
    return checkSeriesDue(series);
  }

  static getFrequencyLabel(frequency: RecurringTransactionSeries['frequency']): string {
    return getFreqLabel(frequency);
  }

  static formatDueDate(series: RecurringTransactionSeries): string {
    return fmtDueDate(series);
  }

  static groupSeriesByUser(
    series: RecurringTransactionSeries[],
    users: Array<{ id: string; name: string }>
  ) {
    return grpSeriesByUser(series, users);
  }

  static calculateMonthlyAmount(series: RecurringTransactionSeries): number {
    return calcMonthlyAmt(series);
  }

  static calculateTotals(series: RecurringTransactionSeries[]) {
    return calculateRecurringTotals(series);
  }

  static hasAccess(series: RecurringTransactionSeries, userId: string): boolean {
    return hasSeriesAccess(series, userId);
  }

  static getAssociatedUsers(
    series: RecurringTransactionSeries,
    allUsers: Array<{ id: string; name: string; theme_color?: string }>
  ) {
    return getSeriesAssociatedUsers(series, allUsers);
  }
}
