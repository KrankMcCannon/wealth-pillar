import 'server-only';
import { AccountService } from './account.service';
import { TransactionService } from './transaction.service';
import { BudgetService } from './budget.service';
import { BudgetPeriodService } from './budget-period.service';
import { CategoryService } from './category.service';
import { RecurringService } from './recurring.service';
import { GroupService } from './group.service';
import { FinanceLogicService } from './finance-logic.service';
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
  budgetPeriods: Record<string, BudgetPeriod | null>; // userId -> active period
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
  budgetPeriods: Record<string, BudgetPeriod | null>; // userId -> active period
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
   */
  static async getDashboardData(groupId: string): Promise<DashboardPageData> {
    // First, get group users to fetch their budget periods
    // Handle error gracefully by defaulting to empty array
    let userIds: string[] = [];
    try {
      const groupUsers = await GroupService.getGroupUsers(groupId);
      userIds = groupUsers.map((u) => u.id);
    } catch (error) {
      console.error(
        '[PageDataService] Failed to fetch group users:',
        error instanceof Error ? error.message : error
      );
    }

    // Fetch all data in parallel with error handling for each promise
    const [
      accounts,
      transactions,
      budgets,
      recurringSeries,
      categories,
      ...periodResults
    ] = await Promise.all([
      AccountService.getAccountsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch accounts:', e);
        return [] as Account[];
      }),
      TransactionService.getTransactionsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch transactions:', e);
        return [] as Transaction[];
      }),
      BudgetService.getBudgetsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch budgets:', e);
        return [] as Budget[];
      }),
      RecurringService.getSeriesByGroup(groupId).catch((e) => {
        console.error(
          '[PageDataService] Failed to fetch recurring series:',
          e
        );
        return [] as RecurringTransactionSeries[];
      }),
      CategoryService.getAllCategories().catch((e) => {
        console.error('[PageDataService] Failed to fetch categories:', e);
        return [] as Category[];
      }),
      // Fetch active budget period for each user
      ...userIds.map((userId) =>
        BudgetPeriodService.getActivePeriod(userId).catch((e) => {
          console.error(
            `[PageDataService] Failed to fetch budget period for user ${userId}:`,
            e
          );
          return null;
        })
      ),
    ]);

    // Build budget periods map (userId -> active period)
    const budgetPeriods: Record<string, BudgetPeriod | null> = {};
    userIds.forEach((userId, index) => {
      // periodResults matches the order of userIds spread in Promise.all
      // TypeScript infers periodResults type from the remaining elements of the array destructuring
      // We need to cast it or handle it carefully since it's mixed with other types in the array destructuring if not precise
      // But here with tuple destructuring, periodResults is collected rest.
      // The type of periodResults is (Account[] | Transaction[] | ... | BudgetPeriod | null)[] which is not ideal.
      // However, we know they come after the fixed 5 promises.
      budgetPeriods[userId] = (periodResults[index] as BudgetPeriod | null) ?? null;
    });

    // Calculate account balances
    const accountIds = (accounts as Account[]).map((a) => a.id);
    const accountBalances = FinanceLogicService.calculateAccountBalances(
      accountIds,
      transactions as Transaction[]
    );

    return {
      accounts: accounts as Account[],
      transactions: transactions as Transaction[],
      budgets: budgets as Budget[],
      budgetPeriods,
      recurringSeries: recurringSeries as RecurringTransactionSeries[],
      categories: categories as Category[],
      accountBalances,
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
  static async getTransactionsPageData(
    groupId: string
  ): Promise<TransactionsPageData> {
    const [transactions, categories, accounts, recurringSeries, budgets] =
      await Promise.all([
        TransactionService.getTransactionsByGroup(groupId).catch((e) => {
          console.error('[PageDataService] Failed to fetch transactions:', e);
          return [] as Transaction[];
        }),
        CategoryService.getAllCategories().catch((e) => {
          console.error('[PageDataService] Failed to fetch categories:', e);
          return [] as Category[];
        }),
        AccountService.getAccountsByGroup(groupId).catch((e) => {
          console.error('[PageDataService] Failed to fetch accounts:', e);
          return [] as Account[];
        }),
        RecurringService.getSeriesByGroup(groupId).catch((e) => {
          console.error(
            '[PageDataService] Failed to fetch recurring series:',
            e
          );
          return [] as RecurringTransactionSeries[];
        }),
        BudgetService.getBudgetsByGroup(groupId).catch((e) => {
          console.error('[PageDataService] Failed to fetch budgets:', e);
          return [] as Budget[];
        }),
      ]);

    return {
      transactions: transactions as Transaction[],
      categories: categories as Category[],
      accounts: accounts as Account[],
      recurringSeries: recurringSeries as RecurringTransactionSeries[],
      budgets: budgets as Budget[],
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
  static async getBudgetsPageData(groupId: string): Promise<BudgetsPageData> {
    // First, get group users to fetch their budget periods
    let userIds: string[] = [];
    try {
      const groupUsers = await GroupService.getGroupUsers(groupId);
      userIds = groupUsers.map((u) => u.id);
    } catch (error) {
      console.error(
        '[PageDataService] Failed to fetch group users:',
        error instanceof Error ? error.message : error
      );
    }

    // Fetch all data in parallel
    const [
      budgets,
      transactions,
      accounts,
      categories,
      ...periodResults
    ] = await Promise.all([
      BudgetService.getBudgetsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch budgets:', e);
        return [] as Budget[];
      }),
      TransactionService.getTransactionsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch transactions:', e);
        return [] as Transaction[];
      }),
      AccountService.getAccountsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch accounts:', e);
        return [] as Account[];
      }),
      CategoryService.getAllCategories().catch((e) => {
        console.error('[PageDataService] Failed to fetch categories:', e);
        return [] as Category[];
      }),
      // Fetch active budget period for each user
      ...userIds.map((userId) =>
        BudgetPeriodService.getActivePeriod(userId).catch((e) => {
          console.error(
            `[PageDataService] Failed to fetch budget period for user ${userId}:`,
            e
          );
          return null;
        })
      ),
    ]);

    // Build budget periods map (userId -> active period)
    const budgetPeriods: Record<string, BudgetPeriod | null> = {};
    userIds.forEach((userId, index) => {
      budgetPeriods[userId] = (periodResults[index] as BudgetPeriod | null) ?? null;
    });

    return {
      budgets: budgets as Budget[],
      transactions: transactions as Transaction[],
      accounts: accounts as Account[],
      categories: categories as Category[],
      budgetPeriods,
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
  static async getAccountsPageData(groupId: string): Promise<AccountsPageData> {
    const [accounts, transactions] = await Promise.all([
      AccountService.getAccountsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch accounts:', e);
        return [] as Account[];
      }),
      TransactionService.getTransactionsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch transactions:', e);
        return [] as Transaction[];
      }),
    ]);

    // Calculate account balances
    const accountsCast = accounts as Account[];
    const transactionsCast = transactions as Transaction[];
    const accountIds = accountsCast.map((a) => a.id);
    const accountBalances = FinanceLogicService.calculateAccountBalances(
      accountIds,
      transactionsCast
    );

    return {
      accounts: accountsCast,
      transactions: transactionsCast,
      accountBalances,
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
  static async getReportsPageData(groupId: string): Promise<ReportsPageData> {
    const [accounts, transactions, categories] = await Promise.all([
      AccountService.getAccountsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch accounts:', e);
        return [] as Account[];
      }),
      TransactionService.getTransactionsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch transactions:', e);
        return [] as Transaction[];
      }),
      CategoryService.getAllCategories().catch((e) => {
        console.error('[PageDataService] Failed to fetch categories:', e);
        return [] as Category[];
      }),
    ]);

    return {
      accounts: accounts as Account[],
      transactions: transactions as Transaction[],
      categories: categories as Category[],
    };
  }
}
