import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useShareSearch, type AvailableShare } from './use-share-search';
import {
  ensureMarketDataAction,
  getShareAssetTypesAllAction,
  getShareBySymbolAction,
  searchSharesAction,
} from '../actions/share-actions';

vi.mock('../actions/share-actions', () => ({
  ensureMarketDataAction: vi.fn(),
  getShareAssetTypesAllAction: vi.fn(),
  getShareBySymbolAction: vi.fn(),
  searchSharesAction: vi.fn(),
}));

function share(symbol: string): AvailableShare {
  return {
    id: symbol,
    symbol,
    name: symbol,
    region: 'US',
    asset_type: 'stock',
    exchange: null,
    currency: 'USD',
    is_popular: false,
    created_at: null,
    updated_at: null,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(getShareAssetTypesAllAction).mockResolvedValue({ data: ['Stock'], error: null });
  vi.mocked(ensureMarketDataAction).mockResolvedValue({ data: null, error: null });
  vi.mocked(getShareBySymbolAction).mockResolvedValue({ data: null, error: null });
});
afterEach(() => {
  vi.useRealTimers();
});

it('debounces searches, derives loading, filters assets and clears short queries', async () => {
  const { promise, resolve } =
    Promise.withResolvers<Awaited<ReturnType<typeof searchSharesAction>>>();
  vi.mocked(searchSharesAction).mockReturnValueOnce(promise);
  const { result } = renderHook(() => useShareSearch());
  act(() => {
    result.current.setSearchValue('apple');
  });
  expect(searchSharesAction).not.toHaveBeenCalled();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
  expect(result.current.isLoading).toBe(true);
  expect(result.current.hasSearched).toBe(true);
  await act(async () => {
    resolve({ data: [share('AAPL')], error: null });
  });
  expect(result.current.results.map((row) => row.symbol)).toEqual(['AAPL']);
  expect(result.current.isLoading).toBe(false);

  vi.mocked(searchSharesAction).mockResolvedValueOnce({ data: [], error: null });
  await act(async () => {
    result.current.setSelectedAssetType('etf');
  });
  expect(searchSharesAction).toHaveBeenLastCalledWith('apple', 'etf');
  expect(result.current.results).toEqual([]);
  act(() => {
    result.current.setSearchValue('ap');
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
  expect(result.current.results).toEqual([]);
  expect(result.current.hasSearched).toBe(false);
  expect(result.current.isLoading).toBe(false);
});

it('ignores responses for an obsolete search and recovers from a rejected request', async () => {
  const old = Promise.withResolvers<Awaited<ReturnType<typeof searchSharesAction>>>();
  vi.mocked(searchSharesAction)
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce({ data: [share('MSFT')], error: null });
  const { result } = renderHook(() => useShareSearch());
  act(() => {
    result.current.setSearchValue('apple');
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
  act(() => {
    result.current.setSearchValue('microsoft');
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
  await act(async () => {
    old.resolve({ data: [share('AAPL')], error: null });
  });
  expect(result.current.results.map((row) => row.symbol)).toEqual(['MSFT']);
  vi.mocked(searchSharesAction).mockRejectedValueOnce(new Error('offline'));
  act(() => {
    result.current.setSearchValue('missing');
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
  expect(result.current.isLoading).toBe(false);
  expect(result.current.results).toEqual([]);
});

it('clears a controlled selection and ignores an obsolete symbol lookup', async () => {
  const old = Promise.withResolvers<Awaited<ReturnType<typeof getShareBySymbolAction>>>();
  vi.mocked(getShareBySymbolAction)
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce({ data: share('MSFT'), error: null });
  const { result, rerender } = renderHook((initialValue) => useShareSearch({ initialValue }), {
    initialProps: 'AAPL',
  });
  await act(async () => {
    rerender('MSFT');
  });
  await act(async () => {
    old.resolve({ data: share('AAPL'), error: null });
  });
  expect(result.current.selectedShare?.symbol).toBe('MSFT');
  rerender('');
  expect(result.current.selectedShare).toBeNull();
});

it('selects immediately while market data initialization is still pending', async () => {
  const ensure = Promise.withResolvers<Awaited<ReturnType<typeof ensureMarketDataAction>>>();
  vi.mocked(ensureMarketDataAction).mockReturnValueOnce(ensure.promise);
  vi.mocked(searchSharesAction).mockResolvedValueOnce({ data: [share('AAPL')], error: null });
  const onSelect = vi.fn();
  const { result, rerender } = renderHook(
    (initialValue) => useShareSearch({ initialValue, onSelect }),
    { initialProps: '' }
  );
  act(() => {
    result.current.setSearchValue('apple');
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
  act(() => {
    result.current.handleSelect('AAPL');
  });
  expect(onSelect).toHaveBeenCalledWith('AAPL');
  rerender('AAPL');
  expect(result.current.selectedShare?.symbol).toBe('AAPL');
  expect(result.current.isEnsuring).toBe(true);
  await act(async () => {
    ensure.resolve({ data: null, error: null });
  });
  expect(result.current.isEnsuring).toBe(false);
});
