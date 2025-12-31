import { AccountService } from './account.service';
import { TransactionService } from './transaction.service';
import { BudgetService } from './budget.service';
import { BudgetPeriodService } from './budget-period.service';
import { CategoryService } from './category.service';
import { RecurringService } from './recurring.service';
import { UserService } from './user.service';
import type { ServiceResult } from './user.service';
import type {
  Account,
  Transaction,
  Budget,
  BudgetPeriod,
  Category,
  RecurringTransactionSeries,
} from '@/lib/types';

/**
 * Page Data Service
 *
 * Centralized service for fetching page-level data with optimal parallel loading.
 * Eliminates Promise.all duplication across dashboard pages.
 *
 * **Architecture Principles:**
 * - Single Responsibility: Each method fetches data for a specific page
 * - DRY: Reuses existing service methods without duplication
 * - Performance: Uses Promise.all for parallel data fetching
 * - Consistency: Same pattern across all dashboard pages
 */

/**
 * Complete dashboard data (all entities)
 */
export interface DashboardPageData {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  budgetPeriods: Map<string, BudgetPeriod | null>; // userId -> active period
  recurringSeries: RecurringTransactionSeries[];
  categories: Category[];
  accountBalances: Record<string, number>;
}

/**
 * Transactions page data
 */
export interface TransactionsPageData {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  recurringSeries: RecurringTransactionSeries[];
  budgets: Budget[];
}

/**
 * Budgets page data
 */
export interface BudgetsPageData {
  budgets: Budget[];
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgetPeriods: Map<string, BudgetPeriod | null>; // userId -> active period
}

/**
 * Accounts page data
 */
export interface AccountsPageData {
  accounts: Account[];
  transactions: Transaction[];
  accountBalances: Record<string, number>;
}

/**
 * Reports page data
 */
export interface ReportsPageData {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
}

/**
 * Page Data Service
 *
 * Provides centralized, optimized data fetching for dashboard pages.
 */
export class PageDataService {
  /**
   * Fetch all data for dashboard page
   *
   * Fetches: accounts, transactions, budgets, budget periods, recurring series, categories
   * Also calculates account balances from transactions.
   * Fetches active budget period for each user in parallel.
   *
   * @param groupId - Group ID to fetch data for
   * @returns Complete dashboard data with account balances and budget periods
   *
   * @example
   * ```typescript
   * const data = await PageDataService.getDashboardData(currentUser.group_id);
   * ```
   */
  static async getDashboardData(
    groupId: string
  ): Promise<ServiceResult<DashboardPageData>> {
    // First, get group users to fetch their budget periods
    const { data: groupUsers } = await UserService.getUsersByGroup(groupId);
    const userIds = groupUsers?.map((u) => u.id) || [];

    // Fetch all data in parallel
    const [
      accountsResult,
      transactionsResult,
      budgetsResult,
      recurringResult,
      categoriesResult,
      ...periodResults
    ] = await Promise.all([
      AccountService.getAccountsByGroup(groupId),
      TransactionService.getTransactionsByGroup(groupId),
      BudgetService.getBudgetsByGroup(groupId),
      RecurringService.getSeriesByGroup(groupId),
      CategoryService.getAllCategories(),
      // Fetch active budget period for each user
      ...userIds.map((userId) =>
        BudgetPeriodService.getActivePeriod(userId)
      ),
    ]);

    // Check for errors
    if (accountsResult.error) {
      return { data: null, error: accountsResult.error };
    }
    if (transactionsResult.error) {
      return { data: null, error: transactionsResult.error };
    }
    if (budgetsResult.error) {
      return { data: null, error: budgetsResult.error };
    }
    if (recurringResult.error) {
      return { data: null, error: recurringResult.error };
    }
    if (categoriesResult.error) {
      return { data: null, error: categoriesResult.error };
    }

    const accounts = accountsResult.data || [];
    const transactions = transactionsResult.data || [];
    const budgets = budgetsResult.data || [];
    const recurringSeries = recurringResult.data || [];
    const categories = categoriesResult.data || [];

    // Build budget periods map (userId -> active period)
    const budgetPeriods = new Map<string, BudgetPeriod | null>();
    userIds.forEach((userId, index) => {
      budgetPeriods.set(userId, periodResults[index].data);
    });

    // Calculate account balances
    const accountIds = accounts.map((a) => a.id);
    const accountBalances = AccountService.calculateAccountBalances(
      accountIds,
      transactions
    );

    return {
      data: {
        accounts,
        transactions,
        budgets,
        budgetPeriods,
        recurringSeries,
        categories,
        accountBalances,
      },
      error: null,
    };
  }

  /**
   * Fetch data for transactions page
   *
   * Fetches: transactions, categories, accounts, recurring series, budgets
   *
   * @param groupId - Group ID to fetch data for
   * @returns Transactions page data
   */
  static async getTransactionsPageData(groupId: string): Promise<ServiceResult<TransactionsPageData>> {
    const [transactionsResult, categoriesResult, accountsResult, recurringResult, budgetsResult] = await Promise.all([
      TransactionService.getTransactionsByGroup(groupId),
      CategoryService.getAllCategories(),
      AccountService.getAccountsByGroup(groupId),
      RecurringService.getSeriesByGroup(groupId),
      BudgetService.getBudgetsByGroup(groupId),
    ]);

    // Check for errors
    if (transactionsResult.error) {
      return { data: null, error: transactionsResult.error };
    }
    if (categoriesResult.error) {
      return { data: null, error: categoriesResult.error };
    }
    if (accountsResult.error) {
      return { data: null, error: accountsResult.error };
    }
    if (recurringResult.error) {
      return { data: null, error: recurringResult.error };
    }
    if (budgetsResult.error) {
      return { data: null, error: budgetsResult.error };
    }

    return {
      data: {
        transactions: transactionsResult.data || [],
        categories: categoriesResult.data || [],
        accounts: accountsResult.data || [],
        recurringSeries: recurringResult.data || [],
        budgets: budgetsResult.data || [],
      },
      error: null,
    };
  }

  /**
   * Fetch data for budgets page
   *
   * Fetches: budgets, transactions, accounts, categories, budget periods (parallel)
   * Fetches active budget period for each user in the group.
   *
   * @param groupId - Group ID to fetch data for
   * @returns Budgets page data with active budget periods
   */
  static async getBudgetsPageData(
    groupId: string
  ): Promise<ServiceResult<BudgetsPageData>> {
    // First, get group users to fetch their budget periods
    const { data: groupUsers } = await UserService.getUsersByGroup(groupId);
    const userIds = groupUsers?.map((u) => u.id) || [];

    // Fetch all data in parallel
    const [
      budgetsResult,
      transactionsResult,
      accountsResult,
      categoriesResult,
      ...periodResults
    ] = await Promise.all([
      BudgetService.getBudgetsByGroup(groupId),
      TransactionService.getTransactionsByGroup(groupId),
      AccountService.getAccountsByGroup(groupId),
      CategoryService.getAllCategories(),
      // Fetch active budget period for each user
      ...userIds.map((userId) =>
        BudgetPeriodService.getActivePeriod(userId)
      ),
    ]);

    // Check for errors
    if (budgetsResult.error) {
      return { data: null, error: budgetsResult.error };
    }
    if (transactionsResult.error) {
      return { data: null, error: transactionsResult.error };
    }
    if (accountsResult.error) {
      return { data: null, error: accountsResult.error };
    }
    if (categoriesResult.error) {
      return { data: null, error: categoriesResult.error };
    }

    // Build budget periods map (userId -> active period)
    const budgetPeriods = new Map<string, BudgetPeriod | null>();
    userIds.forEach((userId, index) => {
      budgetPeriods.set(userId, periodResults[index].data);
    });

    return {
      data: {
        budgets: budgetsResult.data || [],
        transactions: transactionsResult.data || [],
        accounts: accountsResult.data || [],
        categories: categoriesResult.data || [],
        budgetPeriods,
      },
      error: null,
    };
  }

  /**
   * Fetch data for accounts page
   *
   * Fetches: accounts, transactions (parallel)
   * Also calculates account balances from transactions.
   *
   * @param groupId - Group ID to fetch data for
   * @returns Accounts page data with balances
   */
  static async getAccountsPageData(groupId: string): Promise<ServiceResult<AccountsPageData>> {
    const [accountsResult, transactionsResult] = await Promise.all([
      AccountService.getAccountsByGroup(groupId),
      TransactionService.getTransactionsByGroup(groupId),
    ]);

    // Check for errors
    if (accountsResult.error) {
      return { data: null, error: accountsResult.error };
    }
    if (transactionsResult.error) {
      return { data: null, error: transactionsResult.error };
    }

    const accounts = accountsResult.data || [];
    const transactions = transactionsResult.data || [];

    // Calculate account balances
    const accountIds = accounts.map(a => a.id);
    const accountBalances = AccountService.calculateAccountBalances(accountIds, transactions);

    return {
      data: {
        accounts,
        transactions,
        accountBalances,
      },
      error: null,
    };
  }

  /**
   * Fetch data for reports page
   *
   * Fetches: accounts, transactions, categories (parallel)
   *
   * @param groupId - Group ID to fetch data for
   * @returns Reports page data
   */
  static async getReportsPageData(groupId: string): Promise<ServiceResult<ReportsPageData>> {
    const [accountsResult, transactionsResult, categoriesResult] = await Promise.all([
      AccountService.getAccountsByGroup(groupId),
      TransactionService.getTransactionsByGroup(groupId),
      CategoryService.getAllCategories(),
    ]);

    // Check for errors
    if (accountsResult.error) {
      return { data: null, error: accountsResult.error };
    }
    if (transactionsResult.error) {
      return { data: null, error: transactionsResult.error };
    }
    if (categoriesResult.error) {
      return { data: null, error: categoriesResult.error };
    }

    return {
      data: {
        accounts: accountsResult.data || [],
        transactions: transactionsResult.data || [],
        categories: categoriesResult.data || [],
      },
      error: null,
    };
  }
}
