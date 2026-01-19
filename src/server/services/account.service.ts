import { serialize } from '@/lib/utils/serializer';
import 'server-only';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { accountCacheKeys } from '@/lib/cache/keys';
import { AccountRepository, TransactionRepository } from '@/server/dal';
import type { Account } from '@/lib/types';
import { revalidateTag } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/prisma';

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
  static async getAccountById(accountId: string): Promise<Account> {
    if (!accountId || accountId.trim() === '') {
      throw new Error('Account ID is required');
    }

    const getCachedAccount = cached(
      async () => {
        const account = await AccountRepository.getById(accountId);
        if (!account) return null;
        return serialize(account) as unknown as Account;
      },
      accountCacheKeys.byId(accountId),
      cacheOptions.account(accountId)
    );

    const account = await getCachedAccount();

    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  }

  /**
   * Retrieves all accounts for a user
   */
  static async getAccountsByUser(userId: string): Promise<Account[]> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    const getCachedAccounts = cached(
      async () => {
        const accounts = await AccountRepository.getByUser(userId);
        return serialize(accounts || []) as unknown as Account[];
      },
      accountCacheKeys.byUser(userId),
      cacheOptions.accountsByUser(userId)
    );

    const accounts = await getCachedAccounts();

    return accounts;
  }

  /**
   * Retrieves all accounts for a group
   */
  static async getAccountsByGroup(groupId: string): Promise<Account[]> {
    if (!groupId || groupId.trim() === '') {
      throw new Error('Group ID is required');
    }

    const getCachedAccounts = cached(
      async () => {
        const accounts = await AccountRepository.getByGroup(groupId);
        return serialize(accounts || []) as unknown as Account[];
      },
      accountCacheKeys.byGroup(groupId),
      cacheOptions.accountsByGroup(groupId)
    );

    const accounts = await getCachedAccounts();

    return accounts;
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
  static async createAccount(data: CreateAccountInput): Promise<Account> {
    if (!data.name || data.name.trim() === '') throw new Error('Account name is required');
    if (!data.type) throw new Error('Account type is required');
    if (!data.group_id || data.group_id.trim() === '') throw new Error('Group ID is required');
    if (!data.user_ids || data.user_ids.length === 0) throw new Error('At least one user is required for an account');

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

    if (!account) throw new Error('Failed to create account');

    const createdAccount = account as unknown as Account;

    revalidateTag(CACHE_TAGS.ACCOUNTS, 'max');
    revalidateTag(CACHE_TAGS.ACCOUNT(createdAccount.id), 'max');
    revalidateTag(`group:${data.group_id}:accounts`, 'max');
    for (const userId of data.user_ids) {
      revalidateTag(`user:${userId}:accounts`, 'max');
    }

    return serialize(createdAccount);
  }

  /**
   * Updates an existing account
   */
  static async updateAccount(
    accountId: string,
    data: UpdateAccountInput
  ): Promise<Account> {
    if (!accountId || accountId.trim() === '') throw new Error('Account ID is required');

    const updateData: Prisma.accountsUpdateInput = {
      updated_at: new Date(),
      ...data,
    };

    const account = await AccountRepository.update(accountId, updateData);

    if (!account) throw new Error('Failed to update account');

    const updatedAccount = account as unknown as Account;

    revalidateTag(CACHE_TAGS.ACCOUNTS, 'max');
    revalidateTag(CACHE_TAGS.ACCOUNT(accountId), 'max');

    if (updatedAccount.group_id) revalidateTag(`group:${updatedAccount.group_id}:accounts`, 'max');
    if (updatedAccount.user_ids) {
      for (const userId of updatedAccount.user_ids) {
        revalidateTag(`user:${userId}:accounts`, 'max');
      }
    }

    return serialize(updatedAccount);
  }

  /**
   * Deletes an account
   */
  static async deleteAccount(accountId: string): Promise<boolean> {
    if (!accountId || accountId.trim() === '') throw new Error('Account ID is required');

    const account = await this.getAccountById(accountId);

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

    return true;
  }
}
