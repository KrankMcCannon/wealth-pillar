import { beforeEach, expect, it, vi } from 'vitest';
import { MarketDataRepository } from '@/server/repositories/market-data.repository';
import { twelveData } from '@/lib/twelve-data';
import { getBatchMarketDataUseCase } from './market-data.use-cases';
vi.mock('@/server/repositories/market-data.repository', () => ({
  MarketDataRepository: { findBySymbols: vi.fn(), upsert: vi.fn() },
}));
vi.mock('@/lib/twelve-data', () => ({ twelveData: { getTimeSeries: vi.fn(), getQuote: vi.fn() } }));
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
