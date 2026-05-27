import type { Transaction } from '@/lib/types';
import type { CreateTransactionInput } from '@/server/use-cases/transactions/types';
import { getTempId } from '@/lib/utils/temp-id';

export type OptimisticTransactionAction = 'add' | 'replace' | 'remove';

type OptimisticListener = (
  transaction: Transaction,
  action: OptimisticTransactionAction,
  tempId?: string
) => void;

const listeners = new Set<OptimisticListener>();

export const optimisticTransactionBus = {
  subscribe(listener: OptimisticListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  emitAdd(transaction: Transaction) {
    listeners.forEach((listener) => listener(transaction, 'add'));
  },
  emitReplace(tempId: string, transaction: Transaction) {
    listeners.forEach((listener) => listener(transaction, 'replace', tempId));
  },
  emitRemove(tempId: string) {
    listeners.forEach((listener) => listener({ id: tempId } as Transaction, 'remove', tempId));
  },
};

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
