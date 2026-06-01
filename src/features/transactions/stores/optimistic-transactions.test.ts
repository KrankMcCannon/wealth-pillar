import { describe, it, expect, beforeEach } from 'vitest';
import type { Transaction } from '@/lib/types';
import {
  buildOptimisticTransaction,
  mergeOptimisticTransactions,
  useOptimisticTransactionStore,
  type OptimisticEntry,
} from './optimistic-transactions';

function tx(id: string, overrides: Partial<Transaction> = {}): Transaction {
  return {
    id,
    description: 'Test',
    amount: 10,
    type: 'expense',
    category: 'food',
    date: '2024-06-01',
    user_id: 'u1',
    account_id: 'a1',
    created_at: '2024-06-01T10:00:00Z',
    updated_at: '2024-06-01T10:00:00Z',
    ...overrides,
  };
}

describe('mergeOptimisticTransactions', () => {
  it('prepends pending entries that pass the filter and are not on the server list', () => {
    const pending: OptimisticEntry[] = [
      {
        tempId: 'temp-1',
        id: 'temp-1',
        transaction: tx('temp-1'),
        status: 'pending',
      },
    ];

    const result = mergeOptimisticTransactions([tx('server-1')], pending, () => true);
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe('temp-1');
  });

  it('dedupes committed entries already present on the server list', () => {
    const pending: OptimisticEntry[] = [
      {
        tempId: 'temp-1',
        id: 'real-1',
        transaction: tx('real-1'),
        status: 'committed',
      },
    ];

    const result = mergeOptimisticTransactions([tx('real-1')], pending, () => true);
    expect(result).toHaveLength(1);
  });

  it('excludes entries that fail the filter predicate', () => {
    const pending: OptimisticEntry[] = [
      {
        tempId: 'temp-1',
        id: 'temp-1',
        transaction: tx('temp-1', { type: 'income' }),
        status: 'pending',
      },
    ];

    const result = mergeOptimisticTransactions(
      [tx('server-1')],
      pending,
      (transaction) => transaction.type === 'expense'
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('server-1');
  });
});

describe('useOptimisticTransactionStore', () => {
  beforeEach(() => {
    useOptimisticTransactionStore.setState({ pending: [] });
  });

  it('adds, commits, and prunes optimistic entries', () => {
    const optimistic = buildOptimisticTransaction(
      {
        description: 'Coffee',
        amount: 3,
        type: 'expense',
        category: 'food',
        date: '2024-06-01',
        account_id: 'a1',
        user_id: 'u1',
        group_id: 'g1',
      },
      'temp-1'
    );

    useOptimisticTransactionStore.getState().addOptimistic(optimistic, 'temp-1');
    expect(useOptimisticTransactionStore.getState().pending).toHaveLength(1);

    const committed = tx('real-1');
    useOptimisticTransactionStore.getState().commitOptimistic('temp-1', committed);
    expect(useOptimisticTransactionStore.getState().pending[0]?.status).toBe('committed');

    useOptimisticTransactionStore.getState().pruneCommitted(new Set(['real-1']));
    expect(useOptimisticTransactionStore.getState().pending).toHaveLength(0);
  });

  it('rolls back pending entries on failure', () => {
    const optimistic = buildOptimisticTransaction(
      {
        description: 'Coffee',
        amount: 3,
        type: 'expense',
        category: 'food',
        date: '2024-06-01',
        account_id: 'a1',
        user_id: 'u1',
        group_id: 'g1',
      },
      'temp-1'
    );

    useOptimisticTransactionStore.getState().addOptimistic(optimistic, 'temp-1');
    useOptimisticTransactionStore.getState().rollbackOptimistic('temp-1');
    expect(useOptimisticTransactionStore.getState().pending).toHaveLength(0);
  });
});
