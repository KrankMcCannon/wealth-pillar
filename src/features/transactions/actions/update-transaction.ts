'use server';

/**
 * Server Action for Updating Transactions
 */

import { revalidateTag } from 'next/cache';
import { transactionService } from '@/lib/api/client';
import type { Transaction } from "@/lib/types";

/**
 * Update an existing transaction
 * Automatically invalidates related caches after mutation
 */
export async function updateTransactionAction(
  id: string,
  data: Partial<Omit<Transaction, "id" | "created_at" | "updated_at">>
): Promise<{ success: boolean; data?: Transaction; error?: string }> {
  try {
    const transaction = await transactionService.update(id, data);

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
    const errorMessage = error instanceof Error ? error.message : 'Failed to update transaction';
    console.error('[Server Action] updateTransactionAction failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
