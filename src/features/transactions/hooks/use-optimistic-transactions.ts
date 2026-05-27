'use client';

import { useEffect, useState } from 'react';
import type { Transaction } from '@/lib/types';
import {
  optimisticTransactionBus,
  type OptimisticTransactionAction,
} from '../stores/optimistic-transactions';

function applyOptimisticAction(
  state: Transaction[],
  transaction: Transaction,
  action: OptimisticTransactionAction,
  tempId?: string
): Transaction[] {
  switch (action) {
    case 'add':
      return [transaction, ...state];
    case 'replace':
      return state.map((item) => (item.id === tempId ? transaction : item));
    case 'remove':
      return state.filter((item) => item.id !== tempId);
    default:
      return state;
  }
}

/**
 * Merges server-fetched transactions with optimistic updates from create modals.
 * Only the current page list is covered (new records always appear at the top).
 */
export function useOptimisticTransactions(initial: Transaction[]): Transaction[] {
  const [transactions, setTransactions] = useState(initial);

  useEffect(() => {
    setTransactions(initial);
  }, [initial]);

  useEffect(() => {
    return optimisticTransactionBus.subscribe((transaction, action, tempId) => {
      setTransactions((prev) => applyOptimisticAction(prev, transaction, action, tempId));
    });
  }, []);

  return transactions;
}
