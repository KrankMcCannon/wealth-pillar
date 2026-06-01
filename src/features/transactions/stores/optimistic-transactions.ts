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

export interface OptimisticUpdateEntry {
  transaction: Transaction;
  original: Transaction;
  status: OptimisticEntryStatus;
}

export interface OptimisticDeleteEntry {
  original: Transaction;
  status: OptimisticEntryStatus;
}

export interface OptimisticOverlayState {
  pending: OptimisticEntry[];
  updated: Record<string, OptimisticUpdateEntry>;
  deleted: Record<string, OptimisticDeleteEntry>;
}

const emptyOverlay: OptimisticOverlayState = {
  pending: [],
  updated: {},
  deleted: {},
};

interface OptimisticTransactionState extends OptimisticOverlayState {
  addOptimistic: (transaction: Transaction, tempId: string) => void;
  commitOptimistic: (tempId: string, transaction: Transaction) => void;
  rollbackOptimistic: (tempId: string) => void;
  applyUpdateOptimistic: (id: string, transaction: Transaction, original: Transaction) => void;
  commitUpdateOptimistic: (id: string, transaction: Transaction) => void;
  rollbackUpdateOptimistic: (id: string) => void;
  applyDeleteOptimistic: (id: string, original: Transaction) => void;
  commitDeleteOptimistic: (id: string) => void;
  rollbackDeleteOptimistic: (id: string) => void;
  pruneCommitted: (serverIds: Set<string>) => void;
  reset: () => void;
}

export const useOptimisticTransactionStore = create<OptimisticTransactionState>()(
  devtools(
    (set) => ({
      ...emptyOverlay,

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

      applyUpdateOptimistic: (id, transaction, original) =>
        set(
          (state) => ({
            updated: {
              ...state.updated,
              [id]: { transaction, original, status: 'pending' },
            },
          }),
          false,
          'optimistic/applyUpdate'
        ),

      commitUpdateOptimistic: (id, transaction) =>
        set(
          (state) => {
            const entry = state.updated[id];
            if (!entry) return state;
            return {
              updated: {
                ...state.updated,
                [id]: { ...entry, transaction, status: 'committed' as const },
              },
            };
          },
          false,
          'optimistic/commitUpdate'
        ),

      rollbackUpdateOptimistic: (id) =>
        set(
          (state) => {
            const { [id]: _removed, ...updated } = state.updated;
            return { updated };
          },
          false,
          'optimistic/rollbackUpdate'
        ),

      applyDeleteOptimistic: (id, original) =>
        set(
          (state) => ({
            deleted: {
              ...state.deleted,
              [id]: { original, status: 'pending' },
            },
          }),
          false,
          'optimistic/applyDelete'
        ),

      commitDeleteOptimistic: (id) =>
        set(
          (state) => {
            const entry = state.deleted[id];
            if (!entry) return state;
            return {
              deleted: {
                ...state.deleted,
                [id]: { ...entry, status: 'committed' as const },
              },
            };
          },
          false,
          'optimistic/commitDelete'
        ),

      rollbackDeleteOptimistic: (id) =>
        set(
          (state) => {
            const { [id]: _removed, ...deleted } = state.deleted;
            return { deleted };
          },
          false,
          'optimistic/rollbackDelete'
        ),

      pruneCommitted: (serverIds) =>
        set(
          (state) => {
            const updated = Object.fromEntries(
              Object.entries(state.updated).filter(
                ([id, entry]) => entry.status === 'pending' || !serverIds.has(id)
              )
            );
            const deleted = Object.fromEntries(
              Object.entries(state.deleted).filter(
                ([id, entry]) => entry.status === 'pending' || serverIds.has(id)
              )
            );
            return {
              pending: state.pending.filter(
                (entry) => entry.status === 'pending' || !serverIds.has(entry.id)
              ),
              updated,
              deleted,
            };
          },
          false,
          'optimistic/prune'
        ),

      reset: () => set(emptyOverlay, false, 'optimistic/reset'),
    }),
    { name: 'OptimisticTransactions' }
  )
);

export function mergeOptimisticTransactions(
  serverList: Transaction[],
  overlay: OptimisticOverlayState,
  matchesFilters: (tx: Transaction) => boolean
): Transaction[] {
  const serverIds = new Set(serverList.map((transaction) => transaction.id));

  const mergedServer = serverList
    .filter((transaction) => !overlay.deleted[transaction.id])
    .map((transaction) => overlay.updated[transaction.id]?.transaction ?? transaction);

  const optimisticToAdd = overlay.pending
    .filter(
      (entry) =>
        matchesFilters(entry.transaction) && !serverIds.has(entry.id) && !overlay.deleted[entry.id]
    )
    .map((entry) => overlay.updated[entry.id]?.transaction ?? entry.transaction);

  if (optimisticToAdd.length === 0 && mergedServer === serverList) {
    const hasUpdates = Object.keys(overlay.updated).length > 0;
    const hasDeletes = Object.keys(overlay.deleted).length > 0;
    if (!hasUpdates && !hasDeletes) return serverList;
  }

  if (optimisticToAdd.length === 0) return mergedServer;
  return [...optimisticToAdd, ...mergedServer];
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

export function buildOptimisticTransactionFromOriginal(
  original: Transaction,
  payload: CreateTransactionInput
): Transaction {
  const now = new Date().toISOString();
  return {
    ...original,
    description: payload.description,
    amount: payload.amount,
    type: payload.type,
    category: payload.category,
    date: payload.date,
    user_id: payload.user_id ?? null,
    account_id: payload.account_id,
    to_account_id: payload.to_account_id ?? null,
    group_id: payload.group_id ?? original.group_id ?? null,
    updated_at: now,
  };
}
