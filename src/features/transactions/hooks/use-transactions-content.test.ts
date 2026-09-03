import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransactionsContent } from './use-transactions-content';
import {
  buildOptimisticTransaction,
  useOptimisticTransactionStore,
} from '../stores/optimistic-transactions';
import type { Transaction } from '@/lib/types';
import { loadMoreTransactionsAction } from '../actions/transaction-actions';
import { toast } from '@/hooks/use-toast';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/hooks', () => ({
  useIdNameMap: () => ({}),
}));

vi.mock('@/hooks/use-debounced-value', () => ({
  useDebouncedValue: (value: string) => value,
}));

vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => ({ openModal: vi.fn() }),
  useTabState: () => ({ activeTab: 'Transactions', setActiveTab: vi.fn() }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('../actions/transaction-actions', () => ({
  loadMoreTransactionsAction: vi.fn(),
}));

vi.mock('../stores/transaction-edit-store', () => ({
  useTransactionEditStore: (selector: (state: { setSeed: () => void }) => unknown) =>
    selector({ setSeed: vi.fn() }),
}));

const serverTx: Transaction = {
  id: 'server-1',
  description: 'Server tx',
  amount: 20,
  type: 'expense',
  category: 'food',
  date: '2024-06-01',
  user_id: 'u1',
  account_id: 'a1',
  created_at: '2024-06-01T09:00:00Z',
  updated_at: '2024-06-01T09:00:00Z',
};

const baseProps = {
  hasMore: false,
  budgets: [],
  accounts: [],
  appliedQuery: { type: 'all' as const, dateRange: 'all' as const },
};

describe('useTransactionsContent optimistic merge', () => {
  beforeEach(() => {
    useOptimisticTransactionStore.getState().reset();
    vi.mocked(loadMoreTransactionsAction).mockReset();
    vi.mocked(toast).mockReset();
  });

  it('keeps optimistic rows when server transactions refresh', () => {
    const { result, rerender } = renderHook((props) => useTransactionsContent(props), {
      initialProps: {
        ...baseProps,
        transactions: [serverTx],
      },
    });

    act(() => {
      useOptimisticTransactionStore.getState().addOptimistic(
        buildOptimisticTransaction(
          {
            description: 'Optimistic tx',
            amount: 5,
            type: 'expense',
            category: 'food',
            date: '2024-06-02',
            account_id: 'a1',
            user_id: 'u1',
            group_id: 'g1',
          },
          'temp-1'
        ),
        'temp-1'
      );
    });

    expect(result.current.listItems.some((item) => item.id === 'temp-1')).toBe(true);

    rerender({
      ...baseProps,
      transactions: [
        serverTx,
        {
          ...serverTx,
          id: 'server-2',
          description: 'Another server tx',
        },
      ],
    });

    expect(result.current.listItems.some((item) => item.id === 'temp-1')).toBe(true);
  });

  it('prunes committed optimistic rows once the server list contains them', () => {
    const { result, rerender } = renderHook((props) => useTransactionsContent(props), {
      initialProps: {
        ...baseProps,
        transactions: [serverTx],
      },
    });

    act(() => {
      useOptimisticTransactionStore.getState().addOptimistic(
        buildOptimisticTransaction(
          {
            description: 'Optimistic tx',
            amount: 5,
            type: 'expense',
            category: 'food',
            date: '2024-06-02',
            account_id: 'a1',
            user_id: 'u1',
            group_id: 'g1',
          },
          'temp-1'
        ),
        'temp-1'
      );
      useOptimisticTransactionStore.getState().commitOptimistic('temp-1', {
        ...serverTx,
        id: 'real-1',
        description: 'Committed tx',
      });
    });

    expect(result.current.listItems.some((item) => item.id === 'real-1')).toBe(true);

    rerender({
      ...baseProps,
      transactions: [{ ...serverTx, id: 'real-1', description: 'Committed tx' }],
    });

    expect(result.current.listItems.filter((item) => item.id === 'real-1')).toHaveLength(1);
    expect(useOptimisticTransactionStore.getState().pending).toHaveLength(0);
  });

  it('toasts and clears the load-more lock when the action fails', async () => {
    vi.mocked(loadMoreTransactionsAction).mockResolvedValue({
      data: null,
      error: 'network',
    });

    const { result } = renderHook((props) => useTransactionsContent(props), {
      initialProps: {
        ...baseProps,
        hasMore: true,
        nextCursor: 'cursor-1',
        transactions: [serverTx],
      },
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(toast).toHaveBeenCalledWith({ title: 'loadMoreError', variant: 'destructive' });
    expect(result.current.isLoadingMore).toBe(false);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(loadMoreTransactionsAction).toHaveBeenCalledTimes(2);
  });
});
