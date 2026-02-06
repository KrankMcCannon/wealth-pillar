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
import {
  validateId,
  validateRequiredString,
  validateNonEmptyArray,
} from '@/lib/utils/validation-utils';
import { invalidateAccountCaches } from '@/lib/utils/cache-utils';

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
  private static readonly getByGroupDb = cache(async (groupId: string): Promise<Account[]> => {
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
  private static readonly getByUserDb = cache(async (userId: string): Promise<Account[]> => {
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
    const { data, error } = await supabase.from('accounts').select('*').eq('id', id).single();

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
    const { data, error } = await supabase.from('accounts').delete().eq('id', id).select().single();

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
        return serialize(account);
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
        return serialize(accounts);
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
        const { count, error } = await supabase
          .from('accounts')
          .select('id', { count: 'planned', head: true })
          .contains('user_ids', [userId]);

        if (error) throw new Error(error.message);
        return count || 0;
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
        return serialize(accounts);
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
    // Validation using shared utilities
    const name = validateRequiredString(data.name, 'Account name');
    if (!data.type) throw new Error('Account type is required');
    validateId(data.group_id, 'Group ID');
    validateNonEmptyArray(data.user_ids, 'user');

    const now = new Date().toISOString();

    const account = await this.createDb({
      id: data.id,
      name,
      type: data.type,
      user_ids: data.user_ids,
      group_id: data.group_id,
      created_at: now,
      updated_at: now,
    });

    if (!account) throw new Error('Failed to create account');

    // Cache invalidation using shared utility
    invalidateAccountCaches({
      accountId: account.id,
      groupId: data.group_id,
      userIds: data.user_ids,
    });

    return serialize(account);
  }

  /**
   * Updates an existing account
   */
  static async updateAccount(accountId: string, data: UpdateAccountInput): Promise<Account> {
    validateId(accountId, 'Account ID');

    const account = await this.updateDb(accountId, {
      updated_at: new Date().toISOString(),
      ...data,
    });

    if (!account) throw new Error('Failed to update account');

    // Cache invalidation using shared utility
    invalidateAccountCaches({
      accountId,
      groupId: account.group_id || undefined,
      userIds: account.user_ids,
    });

    return serialize(account);
  }

  /**
   * Deletes an account
   */
  static async deleteAccount(accountId: string): Promise<boolean> {
    validateId(accountId, 'Account ID');

    const account = await this.getAccountById(accountId);

    // Delete related transactions first
    await TransactionService.deleteByAccount(accountId);

    // Delete the account
    await this.deleteDb(accountId);

    // Cache invalidation using shared utility
    if (account) {
      invalidateAccountCaches({
        accountId,
        groupId: account.group_id || undefined,
        userIds: account.user_ids,
      });
    }

    return true;
  }
}
