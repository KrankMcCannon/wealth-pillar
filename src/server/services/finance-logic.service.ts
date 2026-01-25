/**
 * Finance Logic Service
 */

import type { Transaction, CategoryBreakdownItem, Budget, BudgetProgress, UserBudgetSummary, User, BudgetPeriod, Account, Category, RecurringTransactionSeries } from '@/lib/types';
import {
  toDateTime,
  now as luxonNow,
  today as luxonToday,
  diffInDays,
  toDateString,
  getDaysInMonth,
  formatDaysUntil,
  formatDateShort,
} from '@/lib/utils';
import { DateTime } from 'luxon';
import type { DateInput } from '@/lib/utils/date-utils';
import { CATEGORY_COLOR_PALETTE, DEFAULT_CATEGORY_COLOR } from '@/features/categories/constants';

export interface OverviewMetrics {
  totalEarned: number;
  totalSpent: number;
  totalTransferred: number;
  totalBalance: number;
}

export class FinanceLogicService {
  /**
   * Filter transactions within a date range
   * @complexity O(n)
   */
  static filterTransactionsByPeriod(
    transactions: Transaction[],
    startDate: DateInput,
    endDate: DateInput
  ): Transaction[] {
    const periodStart = toDateTime(startDate);
    if (!periodStart) return [];
    const normalizedStart = periodStart.startOf('day');

    const periodEnd = endDate ? toDateTime(endDate) : luxonNow();
    if (!periodEnd) return [];
    const normalizedEnd = periodEnd.endOf('day');

    return transactions.filter((t) => {
      const txDate = toDateTime(t.date);
      if (!txDate) return false;
      return txDate >= normalizedStart && txDate <= normalizedEnd;
    });
  }

  /**
   * Calculate overall metrics
   * @complexity O(n)
   */
  static calculateOverviewMetrics(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): OverviewMetrics {
    const accountSet = new Set(userAccountIds);
    let totalEarned = 0;
    let totalSpent = 0;
    let totalTransferred = 0;

    for (const t of transactions) {
      if (userId && t.user_id !== userId) continue;

      if (t.type === 'income' && accountSet.has(t.account_id)) {
        totalEarned += t.amount;
      } else if (t.type === 'expense' && accountSet.has(t.account_id)) {
        totalSpent += t.amount;
      } else if (t.type === 'transfer') {
        const fromUserAccount = accountSet.has(t.account_id);
        const toUserAccount = t.to_account_id && accountSet.has(t.to_account_id);

        if (fromUserAccount) {
          totalTransferred += t.amount;
        }

        if (fromUserAccount && toUserAccount) {
          continue; // Internal transfer
        } else if (fromUserAccount) {
          totalSpent += t.amount; // External OUT
        } else if (toUserAccount) {
          totalEarned += t.amount; // External IN
        }
      }
    }

    return {
      totalEarned,
      totalSpent,
      totalTransferred,
      totalBalance: totalEarned - totalSpent,
    };
  }

  /**
   * Calculate category breakdown with NET analysis
   * @complexity O(n + m log m)
   */
  static calculateCategoryBreakdown(
    transactions: Transaction[]
  ): CategoryBreakdownItem[] {
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
      count: data.count
    }));

    const totalNetSpending = breakdown
      .filter(item => item.net > 0)
      .reduce((sum, item) => sum + item.net, 0);

    for (const item of breakdown) {
      item.percentage = (item.net > 0 && totalNetSpending > 0)
        ? (item.net / totalNetSpending) * 100
        : 0;
    }

    return breakdown.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }

  /**
   * Filter transactions by categories
   * @complexity O(n)
   */
  static filterByCategories(
    transactions: Transaction[],
    categories: string[]
  ): Transaction[] {
    const categorySet = new Set(categories);
    return transactions.filter(t => categorySet.has(t.category));
  }

  /**
   * Calculate historical balance for a specific account
   * Reverses transactions from current balance back to target date
   * 
   * @complexity O(n)
   */
  static calculateHistoricalBalance(
    allTransactions: Transaction[],
    accountId: string,
    currentBalance: number,
    targetDate: DateInput
  ): number {
    // We want the balance at the BEGINNING of the target date
    // So we must reverse all transactions that happened ON or AFTER the target date
    const targetDt = toDateTime(targetDate)?.startOf('day');
    if (!targetDt) return currentBalance;

    // Filter transactions that happened ON or AFTER the target date
    const futureTransactions = allTransactions.filter(t => {
      const tDate = toDateTime(t.date);
      return tDate && tDate >= targetDt;
    });

    let historicalBalance = currentBalance;

    for (const t of futureTransactions) {
      const isSource = t.account_id === accountId;
      const isDest = t.to_account_id === accountId;

      if (!isSource && !isDest) continue;

      // REVERSE the effect of the transaction
      if (t.type === 'expense' && isSource) {
        historicalBalance += t.amount; // Add back spent money
      } else if (t.type === 'income' && isSource) {
        historicalBalance -= t.amount; // Remove received money
      } else if (t.type === 'transfer') {
        if (isSource) {
          historicalBalance += t.amount; // Add back money sent out
        } else if (isDest) {
          historicalBalance -= t.amount; // Remove money received
        }
      }
    }

    return historicalBalance;
  }

  /**
   * Calculate total spent (expenses + outgoing transfers) for an account in a period
   * 
   * @complexity O(n)
   */
  static calculatePeriodTotalSpent(
    periodTransactions: Transaction[],
    accountId: string
  ): number {
    return periodTransactions.reduce((sum, t) => {
      if (t.account_id !== accountId) return sum;

      if (t.type === 'expense' || t.type === 'transfer') {
        return sum + t.amount;
      }
      return sum;
    }, 0);
  }

  /**
   * Calculate total income (income + incoming transfers) for an account in a period
   * 
   * @complexity O(n)
   */
  static calculatePeriodTotalIncome(
    periodTransactions: Transaction[],
    accountId: string
  ): number {
    return periodTransactions.reduce((sum, t) => {
      // Direct income to account
      if (t.account_id === accountId && t.type === 'income') {
        return sum + t.amount;
      }

      // Transfer IN to account
      if (t.to_account_id === accountId && t.type === 'transfer') {
        return sum + t.amount;
      }

      return sum;
    }, 0);
  }

  /**
   * Calculate total transfers (absolute sum of IN and OUT) for a specific account
   * 
   * @complexity O(n)
   */
  static calculatePeriodTotalTransfers(
    periodTransactions: Transaction[],
    accountId: string
  ): number {
    return periodTransactions.reduce((sum, t) => {
      if (t.type !== 'transfer') return sum;

      const isRelated = t.account_id === accountId || t.to_account_id === accountId;
      if (isRelated) {
        return sum + t.amount;
      }
      return sum;
    }, 0);
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
    const annualTransactions = allTransactions.filter(t => {
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
  static calculateBudgetProgress(
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
   * Build complete budget summary for a user (Pure Logic)
   */
  static calculateUserBudgetSummaryPure(
    user: User,
    budgets: Budget[],
    transactions: Transaction[],
    activePeriod: BudgetPeriod | null | undefined
  ): UserBudgetSummary {
    const periodStart = activePeriod ? toDateTime(activePeriod.start_date) : null;
    const periodEnd = activePeriod?.end_date
      ? (toDateTime(activePeriod.end_date)?.endOf('day') ?? null)
      : null;

    const budgetProgress = this.calculateBudgetsWithProgress(
      budgets,
      transactions,
      periodStart,
      periodEnd
    );

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
   * Build complete budget summary for a user using AGGREGATED data
   */
  static calculateUserBudgetSummaryFromAggregation(
    user: User,
    budgets: Budget[],
    spendingData: Array<{ category: string; spent: number; income: number }>,
    activePeriod: BudgetPeriod | null | undefined
  ): UserBudgetSummary {
    const periodStart = activePeriod ? toDateTime(activePeriod.start_date) : null;
    const periodEnd = activePeriod?.end_date
      ? (toDateTime(activePeriod.end_date)?.endOf('day') ?? null)
      : null;

    // Create a map for faster lookup
    const spendingMap = new Map<string, { spent: number; income: number }>();
    spendingData.forEach(item => {
      spendingMap.set(item.category, { spent: item.spent, income: item.income });
    });

    // Calculate progress for each budget
    const validBudgets = budgets.filter((b) => b.amount > 0);
    const budgetProgress: BudgetProgress[] = validBudgets.map(budget => {
      let budgetSpent = 0;
      // let transactionCount = 0; // Aggregation might give count, but for now we might ignore or sum it if available

      // Sum spending for all categories in this budget
      budget.categories.forEach(cat => {
        const data = spendingMap.get(cat);
        if (data) {
          // Logic: Net Spent = (Expense + Outgoing Transfer) - Income
          // data.spent is already (Expense + Outgoing)
          // data.income is Income
          const netSpent = data.spent - data.income;
          budgetSpent += netSpent;
        }
      });

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
        transactionCount: 0 // We don't have this exact count easily from this aggregation shape unless we sum it
      };
    });

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
   * Calculate account balance from transactions (Pure business logic)
   */
  static calculateAccountBalance(
    accountId: string,
    transactions: Transaction[]
  ): number {
    const balance = transactions.reduce((balance, transaction) => {
      // Check if this transaction involves this account
      const isSourceAccount = transaction.account_id === accountId;
      const isDestinationAccount = transaction.to_account_id === accountId;

      // Skip if transaction doesn't involve this account
      if (!isSourceAccount && !isDestinationAccount) {
        return balance;
      }

      // Handle transfers (has to_account_id)
      if (transaction.to_account_id) {
        if (isSourceAccount) {
          // Money leaving this account (regardless of type)
          return balance - transaction.amount;
        } else if (isDestinationAccount) {
          // Money entering this account (regardless of type)
          return balance + transaction.amount;
        }
      }

      // Handle regular transactions (no to_account_id)
      if (isSourceAccount && !transaction.to_account_id) {
        if (transaction.type === 'income') {
          // Income adds to balance
          return balance + transaction.amount;
        } else if (transaction.type === 'expense') {
          // Expense subtracts from balance
          return balance - transaction.amount;
        }
      }

      return balance;
    }, 0);

    // Round to 2 decimal places to avoid floating point precision issues
    return Math.round(balance * 100) / 100;
  }

  // --- CATEGORY PURE LOGIC ---

  /**
   * Finds a category by ID, key, or label
   */
  static findCategory(
    categories: Category[],
    identifier: string
  ): Category | undefined {
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
  static getCategoryColor(
    categories: Category[],
    identifier: string
  ): string {
    const category = this.findCategory(categories, identifier);
    return category?.color || '#6B7280'; // Default gray color
  }

  /**
   * Gets category icon by identifier
   */
  static getCategoryIcon(
    categories: Category[],
    identifier: string
  ): string {
    const category = this.findCategory(categories, identifier);
    return category?.icon || 'default';
  }

  /**
   * Gets category label by identifier
   */
  static getCategoryLabel(
    categories: Category[],
    identifier: string
  ): string {
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

  // --- RECURRING SERIES LOGIC ---

  /**
   * Calculate next weekly due date
   */
  private static calculateWeeklyNextDate(today: DateTime, dueDay: number): string {
    const currentDayOfWeek = today.weekday; // Luxon: 1=Monday, 7=Sunday
    let daysUntilDue = dueDay - currentDayOfWeek;
    if (daysUntilDue <= 0) daysUntilDue += 7;
    return toDateString(today.plus({ days: daysUntilDue }));
  }

  /**
   * Calculate next biweekly due date
   */
  private static calculateBiweeklyNextDate(today: DateTime, dueDay: number): string {
    const currentDayOfWeek = today.weekday;
    let daysUntilDue = dueDay - currentDayOfWeek;
    if (daysUntilDue <= 0) daysUntilDue += 14;
    return toDateString(today.plus({ days: daysUntilDue }));
  }

  /**
   * Calculate next monthly due date
   */
  private static calculateMonthlyNextDate(today: DateTime, dueDay: number): string {
    const currentDay = today.day;

    if (currentDay < dueDay) {
      // Due date is still this month
      const dayToUse = Math.min(dueDay, getDaysInMonth(today.year, today.month));
      return toDateString(today.set({ day: dayToUse }));
    }

    // Due date is next month
    const nextMonth = today.plus({ months: 1 });
    const dayToUse = Math.min(dueDay, getDaysInMonth(nextMonth.year, nextMonth.month));
    return toDateString(nextMonth.set({ day: dayToUse }));
  }

  /**
   * Calculate next yearly due date
   */
  private static calculateYearlyNextDate(today: DateTime, series: RecurringTransactionSeries): string {
    const startDate = toDateTime(series.start_date);
    if (!startDate) {
      return toDateString(today);
    }

    const startMonth = startDate.month;
    const dueDay = series.due_day;

    // Check if this year's occurrence has passed
    const thisYearBase = today.set({ month: startMonth });
    const dayToUseThisYear = Math.min(dueDay, getDaysInMonth(thisYearBase.year, thisYearBase.month));
    const thisYearDate = thisYearBase.set({ day: dayToUseThisYear });

    if (thisYearDate > today) {
      return toDateString(thisYearDate);
    }

    const nextYearBase = today.plus({ years: 1 }).set({ month: startMonth });
    const dayToUseNextYear = Math.min(dueDay, getDaysInMonth(nextYearBase.year, nextYearBase.month));
    return toDateString(nextYearBase.set({ day: dayToUseNextYear }));
  }

  /**
   * Calculate next date for one-time series
   */
  private static calculateOnceNextDate(today: DateTime, series: RecurringTransactionSeries): string {
    const startDate = toDateTime(series.start_date);
    if (!startDate) {
      return toDateString(today);
    }
    return startDate > today
      ? toDateString(startDate)
      : toDateString(today);
  }

  /**
   * Calculate the next execution date for a series based on frequency and due_day
   */
  static calculateNextExecutionDate(
    series: RecurringTransactionSeries
  ): string {
    const today = luxonToday();

    switch (series.frequency) {
      case 'weekly':
        return this.calculateWeeklyNextDate(today, series.due_day);
      case 'biweekly':
        return this.calculateBiweeklyNextDate(today, series.due_day);
      case 'monthly':
        return this.calculateMonthlyNextDate(today, series.due_day);
      case 'yearly':
        return this.calculateYearlyNextDate(today, series);
      default:
        // 'once' - return the start_date or today if passed
        return this.calculateOnceNextDate(today, series);
    }
  }

  /**
   * Calculate days until next due date
   */
  static calculateDaysUntilDue(series: RecurringTransactionSeries): number {
    const nextDate = toDateTime(this.calculateNextExecutionDate(series));
    const today = luxonToday();
    if (!nextDate) return 0;
    return diffInDays(today, nextDate);
  }

  /**
   * Check if a series is due for execution
   */
  static isSeriesDue(series: RecurringTransactionSeries): boolean {
    if (!series.is_active) return false;

    const today = luxonToday();
    const nextExecution = toDateTime(this.calculateNextExecutionDate(series));
    if (!nextExecution) return false;

    return nextExecution <= today;
  }

  /**
   * Get frequency label in Italian
   */
  static getFrequencyLabel(
    frequency: RecurringTransactionSeries['frequency']
  ): string {
    const labels: Record<RecurringTransactionSeries['frequency'], string> = {
      once: 'Una tantum',
      weekly: 'Settimanale',
      biweekly: 'Quindicinale',
      monthly: 'Mensile',
      yearly: 'Annuale',
    };
    return labels[frequency] || frequency;
  }

  /**
   * Format due date with relative time
   */
  static formatDueDate(series: RecurringTransactionSeries): string {
    const daysUntil = this.calculateDaysUntilDue(series);

    if (daysUntil <= 7) {
      return formatDaysUntil(this.calculateNextExecutionDate(series));
    }

    return formatDateShort(this.calculateNextExecutionDate(series));
  }

  /**
   * Group series by user for display
   */
  static groupSeriesByUser(
    series: RecurringTransactionSeries[],
    users: Array<{ id: string; name: string }>
  ): Record<string, { user: { id: string; name: string }; series: RecurringTransactionSeries[] }> {
    const grouped: Record<string, { user: { id: string; name: string }; series: RecurringTransactionSeries[] }> = {};

    for (const user of users) {
      const userSeries = series.filter((s) => s.user_ids.includes(user.id));
      if (userSeries.length > 0) {
        grouped[user.id] = {
          user,
          series: userSeries,
        };
      }
    }

    return grouped;
  }

  /**
   * Calculate monthly cost/income for a series
   */
  static calculateMonthlyAmount(series: RecurringTransactionSeries): number {
    switch (series.frequency) {
      case 'weekly':
        return series.amount * 4.33; // Average weeks per month
      case 'biweekly':
        return series.amount * 2.17;
      case 'monthly':
        return series.amount;
      case 'yearly':
        return series.amount / 12;
      default:
        return series.amount;
    }
  }

  /**
   * Calculate totals for a set of series
   */
  static calculateTotals(series: RecurringTransactionSeries[]): {
    totalIncome: number;
    totalExpenses: number;
    netMonthly: number;
  } {
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const s of series) {
      if (!s.is_active) continue;

      const monthlyAmount = this.calculateMonthlyAmount(s);
      if (s.type === 'income') {
        totalIncome += monthlyAmount;
      } else if (s.type === 'expense') {
        totalExpenses += monthlyAmount;
      }
    }

    return {
      totalIncome,
      totalExpenses,
      netMonthly: totalIncome - totalExpenses,
    };
  }

  /**
   * Check if a user has access to a series
   */
  static hasAccess(series: RecurringTransactionSeries, userId: string): boolean {
    return series.user_ids.includes(userId);
  }

  /**
   * Get all users associated with a series
   */
  static getAssociatedUsers(
    series: RecurringTransactionSeries,
    allUsers: Array<{ id: string; name: string; theme_color?: string }>
  ): Array<{ id: string; name: string; theme_color?: string }> {
    return allUsers.filter(user => series.user_ids.includes(user.id));
  }
}
