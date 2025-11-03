'use server';

/**
 * Server Action for Creating Transactions
 * Executes on server, closer to database, with automatic cache invalidation
 */

import { revalidateTag } from 'next/cache';
import { transactionService } from '@/lib/api/client';
import type { Transaction } from "@/lib/types";

/**
 * Create a new transaction
 * Automatically invalidates related caches after mutation
 *
 * @param data - Transaction data to create
 * @returns Created transaction or error
 *
 * @example
 * const result = await createTransactionAction({
 *   description: 'Grocery shopping',
 *   amount: 125.50,
 *   // ... other fields
 * })
 *
 * if (result.success) {
 *   // Handle success
 * } else {
 *   // Handle error
 * }
 */
export async function createTransactionAction(
  data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; data?: Transaction; error?: string }> {
  try {
    const transaction = await transactionService.create(data);

    // Invalidate related caches
    revalidateTag('transactions');
    revalidateTag('dashboard');
    revalidateTag('financial-summary');
    revalidateTag('account-balances');

    if (data.recurring_series_id) {
      revalidateTag('recurring-series');
    }

    return { success: true, data: transaction };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create transaction';
    console.error('[Server Action] createTransactionAction failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Create multiple transactions in batch
 * More efficient than creating individually
 *
 * @param transactions - Array of transaction data
 * @returns Array of created transactions
 */
export async function createTransactionsBatchAction(
  transactions: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>[]
): Promise<{ success: boolean; data?: Transaction[]; error?: string }> {
  try {
    const results = await Promise.all(
      transactions.map((t) => transactionService.create(t))
    );

    // Invalidate caches once for the batch
    revalidateTag('transactions');
    revalidateTag('dashboard');
    revalidateTag('financial-summary');
    revalidateTag('account-balances');

    return { success: true, data: results };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create transactions';
    console.error('[Server Action] createTransactionsBatchAction failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
