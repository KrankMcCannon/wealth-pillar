import { describe, it, expect, beforeEach } from 'vitest';
import type { Transaction } from '@/lib/types';
import {
  buildOptimisticTransaction,
  mergeOptimisticTransactions,
  useOptimisticTransactionStore,
  type OptimisticEntry,
  type OptimisticOverlayState,
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

const emptyOverlay = (): OptimisticOverlayState => ({
  pending: [],
  updated: {},
  deleted: {},
});

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

    const result = mergeOptimisticTransactions(
      [tx('server-1')],
      { ...emptyOverlay(), pending },
      () => true
    );
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

    const result = mergeOptimisticTransactions(
      [tx('real-1')],
      { ...emptyOverlay(), pending },
      () => true
    );
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
      { ...emptyOverlay(), pending },
      (transaction) => transaction.type === 'expense'
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('server-1');
  });

  it('replaces server rows with optimistic updates', () => {
    const overlay: OptimisticOverlayState = {
      pending: [],
      updated: {
        'server-1': {
          transaction: tx('server-1', { description: 'Updated', amount: 99 }),
          original: tx('server-1'),
          status: 'pending',
        },
      },
      deleted: {},
    };

    const result = mergeOptimisticTransactions([tx('server-1')], overlay, () => true);
    expect(result[0]?.description).toBe('Updated');
    expect(result[0]?.amount).toBe(99);
  });

  it('hides deleted server rows', () => {
    const overlay: OptimisticOverlayState = {
      pending: [],
      updated: {},
      deleted: {
        'server-1': { original: tx('server-1'), status: 'pending' },
      },
    };

    const result = mergeOptimisticTransactions(
      [tx('server-1'), tx('server-2')],
      overlay,
      () => true
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('server-2');
  });
});

describe('useOptimisticTransactionStore', () => {
  beforeEach(() => {
    useOptimisticTransactionStore.getState().reset();
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

  it('applies, commits, and rolls back optimistic updates', () => {
    const original = tx('real-1');
    const updated = tx('real-1', { amount: 50 });

    useOptimisticTransactionStore.getState().applyUpdateOptimistic('real-1', updated, original);
    expect(useOptimisticTransactionStore.getState().updated['real-1']?.transaction.amount).toBe(50);

    useOptimisticTransactionStore
      .getState()
      .commitUpdateOptimistic('real-1', tx('real-1', { amount: 51 }));
    expect(useOptimisticTransactionStore.getState().updated['real-1']?.status).toBe('committed');

    useOptimisticTransactionStore.getState().rollbackUpdateOptimistic('real-1');
    expect(useOptimisticTransactionStore.getState().updated['real-1']).toBeUndefined();
  });

  it('applies, commits, and rolls back optimistic deletes', () => {
    const original = tx('real-1');

    useOptimisticTransactionStore.getState().applyDeleteOptimistic('real-1', original);
    expect(useOptimisticTransactionStore.getState().deleted['real-1']?.status).toBe('pending');

    useOptimisticTransactionStore.getState().commitDeleteOptimistic('real-1');
    expect(useOptimisticTransactionStore.getState().deleted['real-1']?.status).toBe('committed');

    useOptimisticTransactionStore.getState().rollbackDeleteOptimistic('real-1');
    expect(useOptimisticTransactionStore.getState().deleted['real-1']).toBeUndefined();
  });
});
