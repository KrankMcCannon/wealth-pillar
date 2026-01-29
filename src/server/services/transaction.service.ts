import 'server-only';
import { cache } from 'react';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { transactionCacheKeys } from '@/lib/cache/keys';
import { supabase } from '@/server/db/supabase';
import type { Transaction, TransactionType } from '@/lib/types';
import type { Database } from '@/lib/types/database.types';
import { revalidateTag } from 'next/cache';
import { serialize } from '@/lib/utils/serializer';
export { TransactionLogic } from '@/lib/utils/transaction-logic';

type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

// Typed RPC Results (match database.types.ts Functions)
type CategorySpendingResult = Array<{ category: string; spent: number; transaction_count: number }>;
type MonthlySpendingResult = Array<{ month: string; income: number; expense: number }>;
type UserCategorySpendingResult = Array<{ user_id: string; category: string; spent: number; income: number; transaction_count: number }>;

// Typed RPC helper - uses unknown intermediary instead of any
async function typedRpc<TResult>(
  fnName: 'get_group_category_spending' | 'get_group_monthly_spending' | 'get_group_user_category_spending',
  args: { p_group_id: string; p_start_date: string; p_end_date: string }
): Promise<TResult> {
  const client = supabase as unknown as {
    rpc: (fn: string, params: Record<string, string>) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
  const { data, error } = await client.rpc(fnName, args);
  if (error) throw new Error(error.message);
  return data as TResult;
}

/**
 * Input data for creating a new transaction
 */
export interface CreateTransactionInput {
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string | Date;
  user_id: string | null;
  account_id: string;
  to_account_id?: string | null;
  group_id: string;
  frequency?: string;
  recurring_series_id?: string;
}

/**
 * Input data for updating an existing transaction
 */
export type UpdateTransactionInput = Partial<CreateTransactionInput>;

/**
 * Transaction filter options - supports both date range and offset/limit pagination
 */
export interface TransactionFilterOptions {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  type?: 'income' | 'expense' | 'transfer';
  accountId?: string;
  limit?: number;
  offset?: number; // For backward compatibility with infinite scroll
}

/**
 * Transaction Service
 * Handles all transaction-related business logic (service + repository merged)
 */
export class TransactionService {
  // ================== DATABASE OPERATIONS (inlined from repository) ==================

  /**
   * Get transactions by group with date filtering (primary query method)
   */
  private static getByGroupDb = cache(async (
    groupId: string,
    options?: TransactionFilterOptions
  ): Promise<{ data: Transaction[]; total: number; hasMore: boolean }> => {
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('group_id', groupId)
      .order('date', { ascending: false });

    // Date range filtering
    if (options?.startDate) {
      query = query.gte('date', options.startDate.toISOString());
    }
    if (options?.endDate) {
      query = query.lte('date', options.endDate.toISOString());
    }
    if (options?.category) {
      query = query.eq('category', options.category);
    }
    if (options?.type) {
      query = query.eq('type', options.type);
    }
    if (options?.accountId) {
      query = query.eq('account_id', options.accountId);
    }

    // Pagination with offset/limit
    if (options?.limit) {
      const offset = options?.offset || 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    const total = count || 0;
    const offset = options?.offset || 0;
    return {
      data: (data || []) as Transaction[],
      total,
      hasMore: options?.limit ? (offset + (data?.length || 0)) < total : false
    };
  });

  /**
   * Get transactions by user with date filtering
   */
  private static getByUserDb = cache(async (
    userId: string,
    options?: TransactionFilterOptions
  ): Promise<{ data: Transaction[]; total: number }> => {
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (options?.startDate) {
      query = query.gte('date', options.startDate.toISOString());
    }
    if (options?.endDate) {
      query = query.lte('date', options.endDate.toISOString());
    }
    if (options?.category) {
      query = query.eq('category', options.category);
    }
    if (options?.type) {
      query = query.eq('type', options.type);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return { data: (data || []) as Transaction[], total: count || 0 };
  });

  /**
   * Get transactions by account (including transfers)
   */
  private static getByAccountDb = cache(async (accountId: string): Promise<Transaction[]> => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`)
      .order('date', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Transaction[];
  });

  /**
   * Get transaction by ID
   */
  private static async getByIdDb(id: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as Transaction;
  }

  /**
   * Create transaction in database
   */
  private static async createDb(data: TransactionInsert): Promise<Transaction> {
    const { data: created, error } = await supabase
      .from('transactions')
      .insert(data as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as Transaction;
  }

  /**
   * Update transaction in database
   */
  private static async updateDb(id: string, data: TransactionUpdate): Promise<Transaction> {
    const { data: updated, error } = await supabase
      .from('transactions')
      .update(data as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as Transaction;
  }

  /**
   * Delete transaction from database
   */
  private static async deleteDb(id: string): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Transaction;
  }

  /**
   * Delete all transactions for an account
   */
  static async deleteByAccount(accountId: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`);

    if (error) throw new Error(error.message);
  }

  /**
   * Delete all transactions for a user
   */
  static async deleteByUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }

  /**
   * Update account balance (helper for transaction mutations)
   */
  private static async updateAccountBalance(accountId: string, delta: number): Promise<void> {
    const { data: account, error: fetchError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (fetchError) throw new Error(`Failed to fetch account: ${fetchError.message}`);

    const currentBalance = Number((account as { balance?: number })?.balance) || 0;
    const newBalance = currentBalance + delta;

    // Use typed update helper to avoid type inference issues
    const updateClient = supabase as unknown as {
      from: (table: 'accounts') => {
        update: (data: { balance: number }) => {
          eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
        };
      };
    };
    const { error: updateError } = await updateClient.from('accounts').update({ balance: newBalance }).eq('id', accountId);

    if (updateError) throw new Error(`Failed to update balance: ${updateError.message}`);
  }

  // ================== RPC FUNCTIONS ==================

  /**
   * Get category spending breakdown using database RPC
   */
  static getGroupCategorySpending = cache(async (groupId: string, startDate: Date, endDate: Date): Promise<CategorySpendingResult> => {
    return typedRpc<CategorySpendingResult>('get_group_category_spending', {
      p_group_id: groupId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    });
  });

  /**
   * Get monthly spending trend using database RPC
   */
  static getGroupMonthlySpending = cache(async (groupId: string, startDate: Date, endDate: Date): Promise<MonthlySpendingResult> => {
    return typedRpc<MonthlySpendingResult>('get_group_monthly_spending', {
      p_group_id: groupId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    });
  });

  /**
   * Get category spending per user using database RPC
   */
  static getGroupUserCategorySpending = cache(async (groupId: string, startDate: Date, endDate: Date): Promise<UserCategorySpendingResult> => {
    return typedRpc<UserCategorySpendingResult>('get_group_user_category_spending', {
      p_group_id: groupId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    });
  });

  // ================== SERVICE LAYER ==================

  /**
   * Helper to update account balances based on transaction
   */
  private static async updateBalancesForTransaction(transaction: Transaction, direction: 1 | -1): Promise<void> {
    const { amount, type, account_id, to_account_id } = transaction;

    if (type === 'income') {
      await this.updateAccountBalance(account_id, amount * direction);
    } else if (type === 'expense') {
      await this.updateAccountBalance(account_id, -amount * direction);
    } else if (type === 'transfer' && to_account_id) {
      await Promise.all([
        this.updateAccountBalance(account_id, -amount * direction),
        this.updateAccountBalance(to_account_id, amount * direction)
      ]);
    }
  }

  /**
   * Get transactions for a group with date filtering
   */
  static async getTransactionsByGroup(
    groupId: string,
    options?: TransactionFilterOptions
  ): Promise<{ data: Transaction[]; total: number; hasMore: boolean }> {
    if (!groupId?.trim()) throw new Error('Group ID is required');

    const result = await this.getByGroupDb(groupId, options);
    return {
      data: serialize(result.data) as Transaction[],
      total: result.total,
      hasMore: result.hasMore
    };
  }

  /**
   * Get transactions for a user with date filtering
   */
  static async getTransactionsByUser(userId: string, options?: TransactionFilterOptions): Promise<Transaction[]> {
    if (!userId?.trim()) throw new Error('User ID is required');

    const getCachedTransactions = cached(
      async () => {
        const result = await this.getByUserDb(userId, options);
        return serialize(result.data) as Transaction[];
      },
      transactionCacheKeys.byUser(userId),
      cacheOptions.transactionsByUser(userId)
    );

    return getCachedTransactions();
  }

  /**
   * Get transaction count for a user (optimized - only fetches count)
   */
  static async getTransactionCountByUser(userId: string): Promise<number> {
    if (!userId?.trim()) throw new Error('User ID is required');

    const getCachedCount = cached(
      async () => {
        const { count, error } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (error) throw new Error(error.message);
        return count || 0;
      },
      [`user:${userId}:transactions:count`],
      { revalidate: 300, tags: [CACHE_TAGS.TRANSACTIONS, `user:${userId}:transactions`] }
    );

    return getCachedCount();
  }

  /**
   * Get transactions for an account
   */
  static async getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
    if (!accountId?.trim()) throw new Error('Account ID is required');

    const getCachedTransactions = cached(
      async () => {
        const transactions = await this.getByAccountDb(accountId);
        return serialize(transactions) as Transaction[];
      },
      transactionCacheKeys.byAccount(accountId),
      cacheOptions.transactionsByAccount(accountId)
    );

    return getCachedTransactions();
  }

  /**
   * Get a single transaction by ID
   */
  static async getTransactionById(transactionId: string): Promise<Transaction> {
    if (!transactionId?.trim()) throw new Error('Transaction ID is required');

    const getCachedTransaction = cached(
      async () => {
        const transaction = await this.getByIdDb(transactionId);
        if (!transaction) throw new Error('Transaction not found');
        return serialize(transaction) as Transaction;
      },
      ['transaction', 'id', transactionId],
      { revalidate: 120, tags: [CACHE_TAGS.TRANSACTIONS, `transaction:${transactionId}`] }
    );

    return getCachedTransaction();
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(data: CreateTransactionInput): Promise<Transaction> {
    // Validation
    if (!data.description?.trim()) throw new Error('Description is required');
    if (!data.amount || data.amount <= 0) throw new Error('Amount must be greater than zero');
    if (!data.type || !['income', 'expense', 'transfer'].includes(data.type)) throw new Error('Invalid transaction type');
    if (!data.category?.trim()) throw new Error('Category is required');
    if (!data.account_id?.trim()) throw new Error('Account is required');
    if (!data.date) throw new Error('Date is required');
    if (!data.group_id?.trim()) throw new Error('Group ID is required');

    if (data.type === 'transfer') {
      if (!data.to_account_id?.trim()) throw new Error('Destination account is required for transfers');
      if (data.to_account_id === data.account_id) throw new Error('Source and destination accounts must be different');
    }

    const createData: TransactionInsert = {
      description: data.description.trim(),
      amount: data.amount,
      type: data.type,
      category: data.category,
      date: typeof data.date === 'string' ? new Date(data.date).toISOString() : data.date.toISOString(),
      user_id: data.user_id || null,
      account_id: data.account_id,
      to_account_id: data.to_account_id || null,
      frequency: 'once',
      group_id: data.group_id,
    };

    const transaction = await this.createDb(createData);
    await this.updateBalancesForTransaction(transaction, 1);

    // Cache invalidation
    const tags = [CACHE_TAGS.TRANSACTIONS, CACHE_TAGS.ACCOUNTS, `account:${data.account_id}:transactions`, `group:${data.group_id}:transactions`];
    if (data.user_id) tags.push(`user:${data.user_id}:transactions`, `user:${data.user_id}:budgets`);
    if (data.to_account_id) tags.push(`account:${data.to_account_id}:transactions`);
    tags.push(`group:${data.group_id}:budgets`);
    tags.forEach(tag => revalidateTag(tag, 'max'));

    return serialize(transaction) as Transaction;
  }

  /**
   * Update an existing transaction
   */
  static async updateTransaction(id: string, data: UpdateTransactionInput): Promise<Transaction> {
    if (!id?.trim()) throw new Error('Transaction ID is required');

    const existing = await this.getByIdDb(id);
    if (!existing) throw new Error('Transaction not found');

    if (data.type === 'transfer' || existing.type === 'transfer') {
      const toAccountId = data.to_account_id ?? existing.to_account_id;
      const accountId = data.account_id ?? existing.account_id;
      if (data.type === 'transfer' && !toAccountId) throw new Error('Destination account is required for transfers');
      if (toAccountId === accountId) throw new Error('Source and destination accounts must be different');
    }

    const updateData: TransactionUpdate = { updated_at: new Date().toISOString() };
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.date !== undefined) updateData.date = typeof data.date === 'string' ? new Date(data.date).toISOString() : data.date.toISOString();
    if (data.user_id !== undefined) updateData.user_id = data.user_id;
    if (data.account_id !== undefined) updateData.account_id = data.account_id;
    if (data.to_account_id !== undefined) updateData.to_account_id = data.to_account_id;
    if (data.group_id !== undefined) updateData.group_id = data.group_id;

    const updated = await this.updateDb(id, updateData);

    // Balance updates
    await this.updateBalancesForTransaction(existing, -1);
    await this.updateBalancesForTransaction(updated, 1);

    // Cache invalidation
    const tags: string[] = [CACHE_TAGS.TRANSACTIONS, CACHE_TAGS.ACCOUNTS];
    if (existing.user_id) tags.push(`user:${existing.user_id}:transactions`, `user:${existing.user_id}:budgets`);
    if (data.user_id && data.user_id !== existing.user_id) tags.push(`user:${data.user_id}:transactions`, `user:${data.user_id}:budgets`);
    tags.push(`account:${existing.account_id}:transactions`);
    if (existing.to_account_id) tags.push(`account:${existing.to_account_id}:transactions`);
    if (data.account_id && data.account_id !== existing.account_id) tags.push(`account:${data.account_id}:transactions`);
    if (data.to_account_id && data.to_account_id !== existing.to_account_id) tags.push(`account:${data.to_account_id}:transactions`);
    if (existing.group_id) tags.push(`group:${existing.group_id}:transactions`, `group:${existing.group_id}:budgets`);
    if (data.group_id && data.group_id !== existing.group_id) tags.push(`group:${data.group_id}:transactions`, `group:${data.group_id}:budgets`);
    tags.forEach(tag => revalidateTag(tag, 'max'));

    return serialize(updated) as Transaction;
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(id: string): Promise<{ id: string }> {
    if (!id?.trim()) throw new Error('Transaction ID is required');

    const existing = await this.getByIdDb(id);
    if (!existing) throw new Error('Transaction not found');

    await this.deleteDb(id);
    await this.updateBalancesForTransaction(existing, -1);

    // Cache invalidation
    const tags = [CACHE_TAGS.TRANSACTIONS, CACHE_TAGS.ACCOUNTS, `account:${existing.account_id}:transactions`, `group:${existing.group_id}:transactions`];
    if (existing.user_id) tags.push(`user:${existing.user_id}:transactions`, `user:${existing.user_id}:budgets`);
    if (existing.to_account_id) tags.push(`account:${existing.to_account_id}:transactions`);
    tags.push(`group:${existing.group_id}:budgets`);
    tags.forEach(tag => revalidateTag(tag, 'max'));

    return { id };
  }

}
