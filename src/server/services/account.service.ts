import 'server-only';
import { accountCacheKeys, CACHE_TAGS, cached, cacheOptions } from '@/lib/cache';
import { AccountRepository, TransactionRepository } from '@/server/dal';
import type { Account } from '@/lib/types';
import { revalidateTag } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/prisma';

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

export interface UpdateAccountInput {
  name?: string;
  type?: Account['type'];
  user_ids?: string[];
  group_id?: string;
}

/**
 * Account Service
 * Handles account logic using AccountRepository
 */
export class AccountService {
  /**
   * Retrieves account by ID
   */
  static async getAccountById(
    accountId: string
  ): Promise<ServiceResult<Account>> {
    try {
      if (!accountId || accountId.trim() === '') {
        return { data: null, error: 'Account ID is required' };
      }

      const getCachedAccount = cached(
        async () => {
          const account = await AccountRepository.getById(accountId);
          if (!account) return null;
          return account as unknown as Account;
        },
        accountCacheKeys.byId(accountId),
        cacheOptions.account(accountId)
      );

      const account = await getCachedAccount();

      if (!account) return { data: null, error: 'Account not found' };

      return { data: account, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to retrieve account information',
      };
    }
  }

  /**
   * Retrieves all accounts for a user
   */
  static async getAccountsByUser(
    userId: string
  ): Promise<ServiceResult<Account[]>> {
    try {
      if (!userId || userId.trim() === '') {
        return { data: null, error: 'User ID is required' };
      }

      const getCachedAccounts = cached(
        async () => {
          const accounts = await AccountRepository.getByUser(userId);
          return (accounts || []) as unknown as Account[];
        },
        accountCacheKeys.byUser(userId),
        cacheOptions.accountsByUser(userId)
      );

      const accounts = await getCachedAccounts();

      return { data: accounts, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to retrieve user accounts',
      };
    }
  }

  /**
   * Retrieves all accounts for a group
   */
  static async getAccountsByGroup(
    groupId: string
  ): Promise<ServiceResult<Account[]>> {
    try {
      if (!groupId || groupId.trim() === '') {
        return { data: null, error: 'Group ID is required' };
      }

      const getCachedAccounts = cached(
        async () => {
          const accounts = await AccountRepository.getByGroup(groupId);
          return (accounts || []) as unknown as Account[];
        },
        accountCacheKeys.byGroup(groupId),
        cacheOptions.accountsByGroup(groupId)
      );

      const accounts = await getCachedAccounts();

      return { data: accounts, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to retrieve group accounts',
      };
    }
  }

  /**
   * Checks if an account exists by ID
   */
  static async accountExists(accountId: string): Promise<boolean> {
    try {
      if (!accountId || accountId.trim() === '') return false;
      const account = await AccountRepository.getById(accountId);
      return !!account;
    } catch {
      return false;
    }
  }

  /**
   * Creates a new account
   */
  static async createAccount(data: CreateAccountInput): Promise<ServiceResult<Account>> {
    try {
      if (!data.name || data.name.trim() === '') return { data: null, error: 'Account name is required' };
      if (!data.type) return { data: null, error: 'Account type is required' };
      if (!data.group_id || data.group_id.trim() === '') return { data: null, error: 'Group ID is required' };
      if (!data.user_ids || data.user_ids.length === 0) return { data: null, error: 'At least one user is required for an account' };

      const createData: Prisma.accountsCreateInput = {
        id: data.id,
        name: data.name.trim(),
        type: data.type,
        user_ids: data.user_ids,
        group_id: data.group_id,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const account = await AccountRepository.create(createData);

      if (!account) return { data: null, error: 'Failed to create account' };

      const createdAccount = account as unknown as Account;

      revalidateTag(CACHE_TAGS.ACCOUNTS, 'max');
      revalidateTag(CACHE_TAGS.ACCOUNT(createdAccount.id), 'max');
      revalidateTag(`group:${data.group_id}:accounts`, 'max');
      for (const userId of data.user_ids) {
        revalidateTag(`user:${userId}:accounts`, 'max');
      }

      return { data: createdAccount, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create account',
      };
    }
  }

  /**
   * Updates an existing account
   */
  static async updateAccount(
    accountId: string,
    data: UpdateAccountInput
  ): Promise<ServiceResult<Account>> {
    try {
      if (!accountId || accountId.trim() === '') return { data: null, error: 'Account ID is required' };

      const updateData: Prisma.accountsUpdateInput = {
        updated_at: new Date(),
        ...data,
      };

      const account = await AccountRepository.update(accountId, updateData);

      if (!account) return { data: null, error: 'Failed to update account' };

      const updatedAccount = account as unknown as Account;

      revalidateTag(CACHE_TAGS.ACCOUNTS, 'max');
      revalidateTag(CACHE_TAGS.ACCOUNT(accountId), 'max');

      if (updatedAccount.group_id) revalidateTag(`group:${updatedAccount.group_id}:accounts`, 'max');
      if (updatedAccount.user_ids) {
        for (const userId of updatedAccount.user_ids) {
          revalidateTag(`user:${userId}:accounts`, 'max');
        }
      }

      return { data: updatedAccount, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update account',
      };
    }
  }

  /**
   * Deletes an account
   */
  static async deleteAccount(accountId: string): Promise<ServiceResult<boolean>> {
    try {
      if (!accountId || accountId.trim() === '') return { data: null, error: 'Account ID is required' };

      const { data: account } = await this.getAccountById(accountId);

      await prisma.$transaction(async (tx) => {
        // Delete related transactions first (including transfers)
        await TransactionRepository.deleteByAccount(accountId, tx);

        // Delete the account
        // Recurring transactions should cascade via schema relation
        await AccountRepository.delete(accountId, tx);
      });

      revalidateTag(CACHE_TAGS.ACCOUNTS, 'max');
      revalidateTag(CACHE_TAGS.ACCOUNT(accountId), 'max');

      if (account) {
        revalidateTag(`group:${account.group_id}:accounts`, 'max');
        account.user_ids.forEach((userId) => {
          revalidateTag(`user:${userId}:accounts`, 'max');
        });
      }

      return { data: true, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to delete account',
      };
    }
  }
}
