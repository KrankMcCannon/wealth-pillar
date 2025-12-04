import { supabaseServer } from '@/lib/database/server';
import { cached, accountCacheKeys, cacheOptions, CACHE_TAGS } from '@/lib/cache';
import type { Database } from '@/lib/database/types';
import type { Account, Transaction } from '@/lib/types';

async function revalidateCacheTags(tags: string[]) {
  if (typeof window === 'undefined') {
    const { revalidateTag } = await import('next/cache');
    tags.forEach((tag) => revalidateTag(tag));
  }
}

/**
 * Service result type for better error handling
 */
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface CreateAccountInput {
  id?: string;
  name: string;
  type: Account['type'];
  user_ids: string[];
  group_id: string;
}

/**
 * Account Service
 * Handles all account-related business logic following Single Responsibility Principle
 *
 * All methods return ServiceResult for consistent error handling
 * All database queries are cached using Next.js unstable_cache
 */
export class AccountService {
  /**
   * Retrieves account by ID
   * Used for displaying single account details
   *
   * @param accountId - Account ID
   * @returns Account data or error
   *
   * @example
   * const { data: account, error } = await AccountService.getAccountById(accountId);
   * if (error) {
   *   console.error('Failed to get account:', error);
   * }
   */
  static async getAccountById(
    accountId: string
  ): Promise<ServiceResult<Account>> {
    try {
      // Input validation
      if (!accountId || accountId.trim() === '') {
        return {
          data: null,
          error: 'Account ID is required',
        };
      }

      // Create cached query function
      const getCachedAccount = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('accounts')
            .select('*')
            .eq('id', accountId)
            .single();

          if (error) {
            throw new Error(error.message);
          }

          return data;
        },
        accountCacheKeys.byId(accountId),
        cacheOptions.account(accountId)
      );

      const account = await getCachedAccount();

      if (!account) {
        return {
          data: null,
          error: 'Account not found',
        };
      }

      return {
        data: account,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve account information',
      };
    }
  }

  /**
   * Retrieves all accounts for a user
   * Used for displaying user's account list
   *
   * @param userId - User ID
   * @returns Array of accounts or error
   *
   * @example
   * const { data: accounts, error } = await AccountService.getAccountsByUser(userId);
   * if (error) {
   *   console.error('Failed to get accounts:', error);
   * }
   */
  static async getAccountsByUser(
    userId: string
  ): Promise<ServiceResult<Account[]>> {
    try {
      // Input validation
      if (!userId || userId.trim() === '') {
        return {
          data: null,
          error: 'User ID is required',
        };
      }

      // Create cached query function
      const getCachedAccounts = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('accounts')
            .select('*')
            .contains('user_ids', [userId])
            .order('created_at', { ascending: false });

          if (error) {
            throw new Error(error.message);
          }

          return data || [];
        },
        accountCacheKeys.byUser(userId),
        cacheOptions.accountsByUser(userId)
      );

      const accounts = await getCachedAccounts();

      return {
        data: accounts,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve user accounts',
      };
    }
  }

  /**
   * Retrieves all accounts for a group
   * Used for displaying group's shared accounts or group dashboard
   *
   * @param groupId - Group ID
   * @returns Array of accounts or error
   *
   * @example
   * const { data: accounts, error } = await AccountService.getAccountsByGroup(groupId);
   * if (error) {
   *   console.error('Failed to get group accounts:', error);
   * }
   */
  static async getAccountsByGroup(
    groupId: string
  ): Promise<ServiceResult<Account[]>> {
    try {
      // Input validation
      if (!groupId || groupId.trim() === '') {
        return {
          data: null,
          error: 'Group ID is required',
        };
      }

      // Create cached query function
      const getCachedAccounts = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('accounts')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false });

          if (error) {
            throw new Error(error.message);
          }

          return data || [];
        },
        accountCacheKeys.byGroup(groupId),
        cacheOptions.accountsByGroup(groupId)
      );

      const accounts = await getCachedAccounts();

      return {
        data: accounts,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve group accounts',
      };
    }
  }

  /**
   * Checks if an account exists by ID
   * Lightweight check without fetching full account data
   *
   * @param accountId - Account ID
   * @returns Boolean indicating if account exists
   *
   * @example
   * const exists = await AccountService.accountExists(accountId);
   * if (!exists) {
   *   console.error('Account not found');
   * }
   */
  static async accountExists(accountId: string): Promise<boolean> {
    try {
      if (!accountId || accountId.trim() === '') {
        return false;
      }

      const { data, error } = await supabaseServer
        .from('accounts')
        .select('id')
        .eq('id', accountId)
        .single();

      return !error && data !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get account name from account ID (client-side helper)
   * Pure function for getting account name from a list of accounts
   * Does not require database access - used in components with account data already loaded
   *
   * @param accountId - Account ID to look up
   * @param accounts - Array of accounts to search through
   * @returns Account name or 'Sconosciuto' if not found
   *
   * @example
   * const accountName = AccountService.getAccountName(accountId, accounts);
   */
  static getAccountName(
    accountId: string | null,
    accounts: Array<{ id: string; name: string }>
  ): string {
    if (!accountId) return 'Sconosciuto';
    const account = accounts.find((a) => a.id === accountId);
    return account?.name || 'Sconosciuto';
  }

  /**
   * Get default accounts for users (Pure business logic)
   * Filters accounts to only include those that are default accounts for users
   * Used in dashboard to show only one account per user
   *
   * @param accounts - All accounts
   * @param users - Users with default_account_id
   * @returns Only default accounts for the given users
   *
   * @example
   * const defaultAccounts = AccountService.getDefaultAccounts(accounts, groupUsers);
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
   * Filter accounts by user ID (Pure business logic)
   * Returns all accounts that belong to a specific user
   * Note: An account can have multiple users (user_ids is an array)
   *
   * @param accounts - All accounts
   * @param userId - User ID to filter by
   * @returns Accounts belonging to the user
   *
   * @example
   * const userAccounts = AccountService.filterAccountsByUser(accounts, userId);
   */
  static filterAccountsByUser(
    accounts: Account[],
    userId: string
  ): Account[] {
    return accounts.filter((account) => account.user_ids.includes(userId));
  }

  /**
   * Calculate account balance from transactions (Pure business logic)
   * Does not require database access - works with already loaded transaction data
   *
   * Balance calculation logic:
   * 1. If transaction has NO to_account_id:
   *    - Income type: add amount
   *    - Expense type: subtract amount
   *    - Transfer type: should have to_account_id (ignore if not)
   *
   * 2. If transaction HAS to_account_id (transfer):
   *    - If this is the source account (account_id): subtract amount
   *    - If this is the destination account (to_account_id): add amount
   *
   * @param accountId - Account ID to calculate balance for
   * @param transactions - All transactions (will be filtered for this account)
   * @returns Calculated balance
   *
   * @example
   * const balance = AccountService.calculateAccountBalance(accountId, transactions);
   *
   * @complexity O(n) where n is number of transactions
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

  /**
   * Calculate balances for multiple accounts (Pure business logic)
   * Optimized to process all accounts in a single pass through transactions
   *
   * @param accountIds - Array of account IDs
   * @param transactions - All transactions
   * @returns Map of account ID to balance
   *
   * @example
   * const balances = AccountService.calculateAccountBalances(accountIds, transactions);
   * const accountBalance = balances[accountId];
   *
   * @complexity O(n * m) where n is transactions and m is accounts (but single pass)
   */
  static calculateAccountBalances(
    accountIds: string[],
    transactions: Transaction[]
  ): Record<string, number> {
    // Initialize balances map
    const balances: Record<string, number> = {};
    accountIds.forEach((id) => {
      balances[id] = 0;
    });

    // Process each transaction once
    transactions.forEach((transaction) => {
      const sourceAccountId = transaction.account_id;
      const destAccountId = transaction.to_account_id;

      // Handle transfers (has to_account_id)
      if (destAccountId) {
        // Subtract from source account if it's in our list
        if (balances[sourceAccountId] !== undefined) {
          balances[sourceAccountId] -= transaction.amount;
        }
        // Add to destination account if it's in our list
        if (balances[destAccountId] !== undefined) {
          balances[destAccountId] += transaction.amount;
        }
      }
      // Handle regular transactions (no to_account_id)
      else if (balances[sourceAccountId] !== undefined) {
        if (transaction.type === 'income') {
          balances[sourceAccountId] += transaction.amount;
        } else if (transaction.type === 'expense') {
          balances[sourceAccountId] -= transaction.amount;
        }
      }
    });

    // Round all balances to 2 decimal places to avoid floating point precision issues
    Object.keys(balances).forEach((accountId) => {
      balances[accountId] = Math.round(balances[accountId] * 100) / 100;
    });

    return balances;
  }

  /**
   * Creates a new account for onboarding or manual creation flows
   */
  static async createAccount(data: CreateAccountInput): Promise<ServiceResult<Account>> {
    try {
      if (!data.name || data.name.trim() === '') {
        return { data: null, error: 'Account name is required' };
      }

      if (!data.type) {
        return { data: null, error: 'Account type is required' };
      }

      if (!data.group_id || data.group_id.trim() === '') {
        return { data: null, error: 'Group ID is required' };
      }

      if (!data.user_ids || data.user_ids.length === 0) {
        return { data: null, error: 'At least one user is required for an account' };
      }

      const now = new Date().toISOString();
      const insertData: Database['public']['Tables']['accounts']['Insert'] = {
        id: data.id,
        name: data.name.trim(),
        type: data.type,
        user_ids: data.user_ids,
        group_id: data.group_id,
        created_at: now,
        updated_at: now,
      };

      const { data: account, error } = await supabaseServer
        .from('accounts')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!account) {
        return { data: null, error: 'Failed to create account' };
      }

      await revalidateCacheTags([
        CACHE_TAGS.ACCOUNTS,
        CACHE_TAGS.ACCOUNT(account.id),
        `group:${data.group_id}:accounts`,
        ...data.user_ids.map((userId) => `user:${userId}:accounts`),
      ]);

      return { data: account, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create account',
      };
    }
  }
}
