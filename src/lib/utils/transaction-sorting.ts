import type { Transaction } from '@/lib/types';
import { toDateTime } from '@/lib/utils/date-utils';

/**
 * Insert transaction in sorted order (by date descending - most recent first)
 * Uses binary search for O(log n) search + O(n) splice = O(n) total complexity
 *
 * Transactions are sorted by date in descending order (newest first)
 * This maintains consistency with the database query order
 *
 * @param transactions - Existing transactions array (assumed sorted by date desc)
 * @param newTransaction - Transaction to insert
 * @returns New array with transaction inserted at correct position
 *
 * @example
 * const updated = insertTransactionSorted(transactions, newTransaction);
 *
 * @complexity O(n) - Binary search O(log n) + array splice O(n)
 */
export function insertTransactionSorted(
  transactions: Transaction[],
  newTransaction: Transaction
): Transaction[] {
  // Handle empty array
  if (transactions.length === 0) {
    return [newTransaction];
  }

  const newDate = toDateTime(newTransaction.date);
  if (!newDate) {
    // Invalid date - append to end as fallback
    console.warn('Invalid date for transaction, appending to end:', newTransaction);
    return [...transactions, newTransaction];
  }

  // Binary search for insertion point
  // We want descending order (newest first), so we search for the first position
  // where the existing transaction date is less than the new transaction date
  let left = 0;
  let right = transactions.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const midDate = toDateTime(transactions[mid].date);

    if (!midDate) {
      // Handle corrupted data - treat as oldest date
      left = mid + 1;
      continue;
    }

    // For descending order: if midDate < newDate, insert before mid
    if (midDate < newDate) {
      right = mid;
    } else {
      left = mid + 1;
    }
  }

  // Insert at correct position
  const result = [...transactions];
  result.splice(left, 0, newTransaction);
  return result;
}

/**
 * Update transaction in array while maintaining sort order
 * Removes old version and inserts updated version at correct position
 *
 * @param transactions - Existing transactions array (assumed sorted by date desc)
 * @param updatedTransaction - Updated transaction to insert
 * @returns New array with transaction updated and re-sorted
 *
 * @example
 * const updated = updateTransactionSorted(transactions, updatedTransaction);
 *
 * @complexity O(n) - Filter O(n) + insertTransactionSorted O(n)
 */
export function updateTransactionSorted(
  transactions: Transaction[],
  updatedTransaction: Transaction
): Transaction[] {
  // Remove old version
  const withoutOld = transactions.filter((t) => t.id !== updatedTransaction.id);

  // Insert updated version in sorted position
  return insertTransactionSorted(withoutOld, updatedTransaction);
}

/**
 * Remove transaction from array
 * Simple utility for consistency with insert/update
 *
 * @param transactions - Existing transactions array
 * @param transactionId - ID of transaction to remove
 * @returns New array without the transaction
 *
 * @example
 * const updated = removeTransaction(transactions, transactionId);
 *
 * @complexity O(n) - Array filter operation
 */
export function removeTransaction(
  transactions: Transaction[],
  transactionId: string
): Transaction[] {
  return transactions.filter((t) => t.id !== transactionId);
}
