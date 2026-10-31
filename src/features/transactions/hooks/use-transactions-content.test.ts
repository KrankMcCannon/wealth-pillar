import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useTransactionsContent,
  type UseTransactionsContentProps,
} from './use-transactions-content';
import {
  buildOptimisticTransaction,
  useOptimisticTransactionStore,
} from '../stores/optimistic-transactions';
import type { Transaction } from '@/lib/types';
import { loadMoreTransactionsAction } from '../actions/transaction-actions';
import { toast } from '@/hooks/use-toast';

let search = '';
const push = vi.fn();
const router = { push };
let cachedSearch = '';
let cachedParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useSearchParams: () => {
    if (cachedSearch !== search) {
      cachedSearch = search;
      cachedParams = new URLSearchParams(search);
    }
    return cachedParams;
  },
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => router,
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
    search = '';
    push.mockReset();
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
    expect(result.current.loadMoreFailed).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(loadMoreTransactionsAction).toHaveBeenCalledTimes(2);
  });

  it('keeps from on filter navigations', () => {
    search = 'from=%2Fbudgets%2Fb1';
    const { result } = renderHook((props) => useTransactionsContent(props), {
      initialProps: {
        ...baseProps,
        transactions: [serverTx],
      },
    });

    act(() => {
      result.current.handleUserFilterChange('u2');
    });

    expect(push).toHaveBeenCalledWith('/transactions?user=u2&from=%2Fbudgets%2Fb1');
  });

  it('restores the URL search draft during browser navigation', () => {
    const { result, rerender } = renderHook<
      ReturnType<typeof useTransactionsContent>,
      UseTransactionsContentProps
    >((props: UseTransactionsContentProps) => useTransactionsContent(props), {
      initialProps: {
        ...baseProps,
        transactions: [serverTx],
        appliedQuery: { ...baseProps.appliedQuery, q: 'rent' },
      },
    });
    act(() => {
      result.current.setFilters((current) => ({ ...current, searchQuery: 'coffee' }));
    });
    expect(result.current.filters.searchQuery).toBe('coffee');
    push.mockClear();
    rerender({
      ...baseProps,
      transactions: [serverTx],
      appliedQuery: { ...baseProps.appliedQuery, q: 'salary' },
    });
    expect(result.current.filters.searchQuery).toBe('salary');
    expect(push).not.toHaveBeenCalled();
  });

  it('resets pagination on query changes and ignores an old in-flight page', async () => {
    const old = Promise.withResolvers<Awaited<ReturnType<typeof loadMoreTransactionsAction>>>();
    vi.mocked(loadMoreTransactionsAction).mockReturnValueOnce(old.promise);
    const { result, rerender } = renderHook<
      ReturnType<typeof useTransactionsContent>,
      UseTransactionsContentProps
    >((props: UseTransactionsContentProps) => useTransactionsContent(props), {
      initialProps: {
        ...baseProps,
        transactions: [serverTx],
        hasMore: true,
        nextCursor: 'old-cursor',
      },
    });
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.loadMore();
    });
    expect(result.current.isLoadingMore).toBe(true);
    rerender({
      ...baseProps,
      transactions: [],
      appliedQuery: { ...baseProps.appliedQuery, type: 'income' },
    });
    expect(result.current.isLoadingMore).toBe(false);
    expect(result.current.hasMore).toBe(false);
    await act(async () => {
      old.resolve({
        data: {
          transactions: [{ ...serverTx, id: 'obsolete' }],
          hasMore: true,
          nextCursor: 'obsolete-cursor',
        },
        error: null,
      });
      await pending;
    });
    expect(result.current.listItems).toEqual([]);
    expect(result.current.hasMore).toBe(false);
  });

  it('discards a pending page even after navigating back to the original query', async () => {
    const old = Promise.withResolvers<Awaited<ReturnType<typeof loadMoreTransactionsAction>>>();
    vi.mocked(loadMoreTransactionsAction).mockReturnValueOnce(old.promise);
    const initial = { ...baseProps, transactions: [serverTx], hasMore: true, nextCursor: 'cursor' };
    const { result, rerender } = renderHook<
      ReturnType<typeof useTransactionsContent>,
      UseTransactionsContentProps
    >((props: UseTransactionsContentProps) => useTransactionsContent(props), {
      initialProps: initial,
    });
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.loadMore();
    });
    rerender({
      ...baseProps,
      transactions: [],
      appliedQuery: { ...baseProps.appliedQuery, type: 'income' },
    });
    rerender(initial);
    await act(async () => {
      old.resolve({
        data: { transactions: [{ ...serverTx, id: 'obsolete' }], hasMore: false },
        error: null,
      });
      await pending;
    });
    expect(result.current.listItems.map((row) => row.id)).toEqual(['server-1']);
    expect(result.current.hasMore).toBe(true);
  });
  it('clears budget constraints once while preserving search, type and return context', () => {
    search = 'budget=b1&type=expense&q=rent&dateRange=month&from=%2Freports';
    const props = {
      ...baseProps,
      transactions: [serverTx],
      appliedQuery: { type: 'expense' as const, dateRange: 'month' as const, q: 'rent' },
    };
    const { result } = renderHook(() => useTransactionsContent(props));
    act(() => result.current.handleClearBudgetFilter());
    expect(push).toHaveBeenCalledTimes(1);
    const href = new URL(push.mock.calls[0]![0], 'https://local.test');
    expect(href.searchParams.get('q')).toBe('rent');
    expect(href.searchParams.get('type')).toBe('expense');
    expect(href.searchParams.get('from')).toBe('/reports');
    expect(href.searchParams.has('budget')).toBe(false);
    expect(href.searchParams.has('dateRange')).toBe(false);
  });

  it('does not paginate a new search using the old cursor', async () => {
    search = '';
    const props = {
      ...baseProps,
      transactions: [serverTx],
      hasMore: true,
      nextCursor: 'old-cursor',
    };
    const { result } = renderHook(() => useTransactionsContent(props));
    act(() => result.current.setFilters({ ...result.current.filters, searchQuery: 'new query' }));
    await act(async () => result.current.loadMore());
    expect(loadMoreTransactionsAction).not.toHaveBeenCalled();
    expect(result.current.isNavigatingFilters).toBe(true);
  });
});
