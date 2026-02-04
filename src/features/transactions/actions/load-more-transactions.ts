'use server';

import { getCurrentUser } from '@/lib/auth/cached-auth';
import { TransactionService } from '@/server/services';
import type { Transaction } from '@/lib/types';

/**
 * Server Action: Load More Transactions (Paginated)
 *
 * Fetches additional transactions for infinite scroll.
 *
 * @param offset - Number of transactions to skip
 * @param limit - Number of transactions to fetch (default 50)
 * @returns Paginated transactions with metadata
 */

/**
 * Result type for the load more transactions action
 */
export interface LoadMoreTransactionsResult {
  data: Transaction[];
  total: number;
  hasMore: boolean;
  error: string | null;
}

export async function loadMoreTransactionsAction(
  offset: number,
  limit: number = 50
): Promise<LoadMoreTransactionsResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: [], total: 0, hasMore: false, error: 'Non autenticato' };
    }

    const result = await TransactionService.getTransactionsByGroup(currentUser.group_id || '', {
      limit,
      offset,
    });

    return {
      data: result.data,
      total: result.total,
      hasMore: result.hasMore,
      error: null,
    };
  } catch (error) {
    console.error('[loadMoreTransactionsAction] Error:', error);
    return {
      data: [],
      total: 0,
      hasMore: false,
      error: error instanceof Error ? error.message : 'Failed to load transactions',
    };
  }
}
