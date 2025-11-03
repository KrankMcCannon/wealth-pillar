'use server';

/**
 * Server Action for Deleting Transactions
 */

import { revalidateTag } from 'next/cache';
import { transactionService } from '@/lib/api/client';

/**
 * Delete a transaction
 * Automatically invalidates related caches after mutation
 */
export async function deleteTransactionAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await transactionService.delete(id);

    // Invalidate related caches
    revalidateTag('transactions');
    revalidateTag('dashboard');
    revalidateTag('financial-summary');
    revalidateTag('account-balances');

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete transaction';
    console.error('[Server Action] deleteTransactionAction failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete multiple transactions in batch
 */
export async function deleteTransactionsBatchAction(
  ids: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await Promise.all(ids.map((id) => transactionService.delete(id)));

    // Invalidate caches once for the batch
    revalidateTag('transactions');
    revalidateTag('dashboard');
    revalidateTag('financial-summary');
    revalidateTag('account-balances');

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete transactions';
    console.error('[Server Action] deleteTransactionsBatchAction failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
