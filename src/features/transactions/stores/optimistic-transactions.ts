import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Transaction } from '@/lib/types';
import type { CreateTransactionInput } from '@/server/use-cases/transactions/types';
import { getTempId } from '@/lib/utils/temp-id';

export type OptimisticEntryStatus = 'pending' | 'committed';

export interface OptimisticEntry {
  tempId: string;
  id: string;
  transaction: Transaction;
  status: OptimisticEntryStatus;
}

interface OptimisticTransactionState {
  pending: OptimisticEntry[];
  addOptimistic: (transaction: Transaction, tempId: string) => void;
  commitOptimistic: (tempId: string, transaction: Transaction) => void;
  rollbackOptimistic: (tempId: string) => void;
  pruneCommitted: (serverIds: Set<string>) => void;
}

export const useOptimisticTransactionStore = create<OptimisticTransactionState>()(
  devtools(
    (set) => ({
      pending: [],
      addOptimistic: (transaction, tempId) =>
        set(
          (state) => ({
            pending: [...state.pending, { tempId, id: tempId, transaction, status: 'pending' }],
          }),
          false,
          'optimistic/add'
        ),
      commitOptimistic: (tempId, transaction) =>
        set(
          (state) => ({
            pending: state.pending.map((entry) =>
              entry.tempId === tempId
                ? { ...entry, id: transaction.id, transaction, status: 'committed' as const }
                : entry
            ),
          }),
          false,
          'optimistic/commit'
        ),
      rollbackOptimistic: (tempId) =>
        set(
          (state) => ({
            pending: state.pending.filter((entry) => entry.tempId !== tempId),
          }),
          false,
          'optimistic/rollback'
        ),
      pruneCommitted: (serverIds) =>
        set(
          (state) => ({
            pending: state.pending.filter(
              (entry) => entry.status === 'pending' || !serverIds.has(entry.id)
            ),
          }),
          false,
          'optimistic/prune'
        ),
    }),
    { name: 'OptimisticTransactions' }
  )
);

export function mergeOptimisticTransactions(
  serverList: Transaction[],
  pending: OptimisticEntry[],
  matchesFilters: (tx: Transaction) => boolean
): Transaction[] {
  const serverIds = new Set(serverList.map((transaction) => transaction.id));
  const optimisticToAdd = pending
    .filter((entry) => matchesFilters(entry.transaction) && !serverIds.has(entry.id))
    .map((entry) => entry.transaction);

  if (optimisticToAdd.length === 0) return serverList;
  return [...optimisticToAdd, ...serverList];
}

export function buildOptimisticTransaction(
  payload: CreateTransactionInput,
  tempId: string = getTempId('temp-tx')
): Transaction {
  const now = new Date().toISOString();
  return {
    id: tempId,
    description: payload.description,
    amount: payload.amount,
    type: payload.type,
    category: payload.category,
    date: payload.date,
    user_id: payload.user_id ?? null,
    account_id: payload.account_id,
    to_account_id: payload.to_account_id ?? null,
    group_id: payload.group_id ?? null,
    created_at: now,
    updated_at: now,
  };
}
