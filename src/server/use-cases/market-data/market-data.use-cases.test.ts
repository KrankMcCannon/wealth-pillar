import { beforeEach, expect, it, vi } from 'vitest';
import { MarketDataRepository } from '@/server/repositories/market-data.repository';
import { twelveData } from '@/lib/twelve-data';
import { getBatchMarketDataUseCase } from './market-data.use-cases';
vi.mock('@/server/repositories/market-data.repository', () => ({
  MarketDataRepository: { findBySymbols: vi.fn(), upsert: vi.fn() },
}));
vi.mock('@/lib/twelve-data', () => ({ twelveData: { getTimeSeries: vi.fn(), getQuote: vi.fn() } }));
const providerValues = [
  { time: '2026-10-30', open: '12', high: '12', low: '12', close: '12', volume: '0' },
];
beforeEach(() => vi.resetAllMocks());
it('shows quote dates even when a cache was fetched much later', async () => {
  vi.mocked(MarketDataRepository.findBySymbols).mockResolvedValue([
    {
      symbol: 'AAA',
      data: [{ datetime: '2026-10-30', close: '12' }],
      last_updated: new Date().toISOString(),
    },
  ]);
  expect(await getBatchMarketDataUseCase(['AAA'])).toEqual([
    { symbol: 'AAA', data: [{ datetime: '2026-10-30', close: 12 }], lastUpdated: '2026-10-30' },
  ]);
  expect(twelveData.getTimeSeries).not.toHaveBeenCalled();
});
it('does not treat an empty, recently fetched cache as usable market data', async () => {
  vi.mocked(MarketDataRepository.findBySymbols).mockResolvedValue([
    { symbol: 'AAA', data: [], last_updated: new Date().toISOString() },
  ]);
  vi.mocked(twelveData.getTimeSeries).mockResolvedValue([]);
  vi.mocked(twelveData.getQuote).mockResolvedValue({ close: '12' } as never);
  expect(await getBatchMarketDataUseCase(['AAA'])).toEqual([
    { symbol: 'AAA', data: [], lastUpdated: null },
  ]);
  expect(twelveData.getTimeSeries).toHaveBeenCalled();
  // A quote with no provider date must never be stamped with today's date.
  expect(MarketDataRepository.upsert).not.toHaveBeenCalled();
});

it('fetches ten missing symbols concurrently with a limit of three, preserving order and failures', async () => {
  vi.mocked(MarketDataRepository.findBySymbols).mockResolvedValue([]);
  const symbols = Array.from({ length: 10 }, (_, index) => `ASSET${index}`);
  const releases = new Map<string, () => void>();
  let active = 0;
  let peak = 0;
  vi.mocked(twelveData.getTimeSeries).mockImplementation(async (symbol) => {
    active++;
    peak = Math.max(peak, active);
    await new Promise<void>((resolve) => releases.set(symbol, resolve));
    active--;
    if (symbol === 'ASSET1') throw new Error('Provider unavailable');
    return providerValues;
  });
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const pending = getBatchMarketDataUseCase([...symbols, 'asset0']);
    await vi.waitFor(() => expect(releases.size).toBe(3));
    expect(active).toBe(3);
    // Finish out of order, including one rejection. Free workers must keep draining the queue.
    releases.get('ASSET2')!();
    await vi.waitFor(() => expect(releases.has('ASSET3')).toBe(true));
    releases.get('ASSET1')!();
    await vi.waitFor(() => expect(releases.has('ASSET4')).toBe(true));
    for (let index = 0; index < symbols.length; index++) {
      const symbol = symbols[index]!;
      await vi.waitFor(() => expect(releases.has(symbol)).toBe(true));
      releases.get(symbol)!();
    }
    const results = await pending;
    expect(peak).toBe(3);
    expect(results.map((result) => result.symbol)).toEqual(symbols);
    expect(results[1]).toEqual({ symbol: 'ASSET1', data: [], lastUpdated: null });
    expect(results.filter((result) => result.data.length)).toHaveLength(9);
    expect(MarketDataRepository.findBySymbols).toHaveBeenCalledExactlyOnceWith(symbols);
    expect(MarketDataRepository.upsert).toHaveBeenCalledTimes(9);
  } finally {
    for (const release of releases.values()) release();
    log.mockRestore();
  }
});

it('mixes fresh, stale and missing quotes without refetching fresh data', async () => {
  vi.mocked(MarketDataRepository.findBySymbols).mockResolvedValue([
    {
      symbol: 'FRESH',
      data: [{ datetime: '2026-10-30', close: 10 }],
      last_updated: new Date().toISOString(),
    },
    { symbol: 'STALE', data: [{ datetime: '2026-10-29', close: 11 }], last_updated: '2020-01-01' },
  ]);
  vi.mocked(twelveData.getTimeSeries).mockResolvedValue(providerValues);
  expect(await getBatchMarketDataUseCase(['fresh', 'stale', 'missing', 'FRESH'])).toMatchObject([
    { symbol: 'FRESH', data: [{ datetime: '2026-10-30', close: 10 }], lastUpdated: '2026-10-30' },
    { symbol: 'STALE', data: [{ datetime: '2026-10-29', close: 11 }], lastUpdated: '2026-10-29' },
    { symbol: 'MISSING', data: [{ datetime: '2026-10-30', close: 12 }], lastUpdated: '2026-10-30' },
  ]);
  expect(
    vi
      .mocked(twelveData.getTimeSeries)
      .mock.calls.map(([symbol]) => symbol)
      .sort()
  ).toEqual(['MISSING', 'STALE']);
});
