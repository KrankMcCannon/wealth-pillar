import { serialize } from '@/lib/utils/serializer';
import 'server-only';
import { cache } from 'react';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { accountCacheKeys } from '@/lib/cache/keys';
import { supabase } from '@/server/db/supabase';
import { TransactionService } from './transaction.service';
import type { Account } from '@/lib/types';
import type { Database } from '@/lib/types/database.types';
import { revalidateTag } from 'next/cache';

type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
type AccountUpdate = Database['public']['Tables']['accounts']['Update'];

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
 * Handles account logic with inlined database operations
 */
export class AccountService {
  // ================== DATABASE OPERATIONS (inlined from repository) ==================

  /**
   * Get accounts by group ID
   */
  private static getByGroupDb = cache(async (groupId: string): Promise<Account[]> => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as Account[];
  });

  /**
   * Get accounts by user ID (where user_ids contains userId)
   */
  private static getByUserDb = cache(async (userId: string): Promise<Account[]> => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .contains('user_ids', [userId])
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as Account[];
  });

  /**
   * Get specific account by ID
   */
  private static async getByIdDb(id: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as Account;
  }

  /**
   * Create a new account in database
   */
  private static async createDb(data: AccountInsert): Promise<Account> {
    const { data: created, error } = await supabase
      .from('accounts')
      .insert(data as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as Account;
  }

  /**
   * Update an account in database
   */
  private static async updateDb(id: string, data: AccountUpdate): Promise<Account> {
    const { data: updated, error } = await supabase
      .from('accounts')
      .update(data as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as Account;
  }

  /**
   * Delete an account from database
   */
  private static async deleteDb(id: string): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Account;
  }

  // ================== SERVICE LAYER ==================

  /**
   * Retrieves account by ID
   */
  static async getAccountById(accountId: string): Promise<Account> {
    if (!accountId?.trim()) throw new Error('Account ID is required');

    const getCachedAccount = cached(
      async () => {
        const account = await this.getByIdDb(accountId);
        if (!account) return null;
        return serialize(account) as Account;
      },
      accountCacheKeys.byId(accountId),
      cacheOptions.account(accountId)
    );

    const account = await getCachedAccount();
    if (!account) throw new Error('Account not found');
    return account;
  }

  /**
   * Retrieves all accounts for a user
   */
  static async getAccountsByUser(userId: string): Promise<Account[]> {
    if (!userId?.trim()) throw new Error('User ID is required');

    const getCachedAccounts = cached(
      async () => {
        const accounts = await this.getByUserDb(userId);
        return serialize(accounts) as Account[];
      },
      accountCacheKeys.byUser(userId),
      cacheOptions.accountsByUser(userId)
    );

    return getCachedAccounts();
  }

  /**
   * Retrieves account count for a user
   */
  static async getAccountCountByUser(userId: string): Promise<number> {
    if (!userId?.trim()) throw new Error('User ID is required');

    const getCachedCount = cached(
      async () => {
        const accounts = await this.getByUserDb(userId);
        return accounts.length;
      },
      [`user:${userId}:accounts:count`],
      { revalidate: 300, tags: [CACHE_TAGS.ACCOUNTS, `user:${userId}:accounts`] }
    );

    return getCachedCount();
  }

  /**
   * Retrieves all accounts for a group
   */
  static async getAccountsByGroup(groupId: string): Promise<Account[]> {
    if (!groupId?.trim()) throw new Error('Group ID is required');

    const getCachedAccounts = cached(
      async () => {
        const accounts = await this.getByGroupDb(groupId);
        return serialize(accounts) as Account[];
      },
      accountCacheKeys.byGroup(groupId),
      cacheOptions.accountsByGroup(groupId)
    );

    return getCachedAccounts();
  }

  /**
   * Checks if an account exists by ID
   */
  static async accountExists(accountId: string): Promise<boolean> {
    try {
      if (!accountId?.trim()) return false;
      const account = await this.getByIdDb(accountId);
      return !!account;
    } catch {
      return false;
    }
  }

  /**
   * Creates a new account
   */
  static async createAccount(data: CreateAccountInput): Promise<Account> {
    if (!data.name?.trim()) throw new Error('Account name is required');
    if (!data.type) throw new Error('Account type is required');
    if (!data.group_id?.trim()) throw new Error('Group ID is required');
    if (!data.user_ids?.length) throw new Error('At least one user is required');

    const now = new Date().toISOString();

    const account = await this.createDb({
      id: data.id,
      name: data.name.trim(),
      type: data.type,
      user_ids: data.user_ids,
      group_id: data.group_id,
      created_at: now,
      updated_at: now,
    });

    if (!account) throw new Error('Failed to create account');

    revalidateTag(CACHE_TAGS.ACCOUNTS, 'max');
    revalidateTag(CACHE_TAGS.ACCOUNT(account.id), 'max');
    revalidateTag(`group:${data.group_id}:accounts` as any, 'max');
    data.user_ids.forEach(userId => revalidateTag(`user:${userId}:accounts` as any, 'max'));

    return serialize(account);
  }

  /**
   * Updates an existing account
   */
  static async updateAccount(accountId: string, data: UpdateAccountInput): Promise<Account> {
    if (!accountId?.trim()) throw new Error('Account ID is required');

    const account = await this.updateDb(accountId, {
      updated_at: new Date().toISOString(),
      ...data,
    });

    if (!account) throw new Error('Failed to update account');

    revalidateTag(CACHE_TAGS.ACCOUNTS, 'max');
    revalidateTag(CACHE_TAGS.ACCOUNT(accountId), 'max');
    if (account.group_id) revalidateTag(`group:${account.group_id}:accounts` as any, 'max');
    if (account.user_ids) account.user_ids.forEach(userId => revalidateTag(`user:${userId}:accounts` as any, 'max'));

    return serialize(account);
  }

  /**
   * Deletes an account
   */
  static async deleteAccount(accountId: string): Promise<boolean> {
    if (!accountId?.trim()) throw new Error('Account ID is required');

    const account = await this.getAccountById(accountId);

    // Delete related transactions first
    await TransactionService.deleteByAccount(accountId);

    // Delete the account
    await this.deleteDb(accountId);

    revalidateTag(CACHE_TAGS.ACCOUNTS, 'max');
    revalidateTag(CACHE_TAGS.ACCOUNT(accountId), 'max');
    if (account) {
      revalidateTag(`group:${account.group_id}:accounts` as any, 'max');
      account.user_ids.forEach(userId => revalidateTag(`user:${userId}:accounts` as any, 'max'));
    }

    return true;
  }
}
