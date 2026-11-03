import { beforeEach, expect, it, vi } from 'vitest';
import { fetchExchangeRates } from '@/lib/currency/frankfurter';
import { MarketDataRepository } from '@/server/repositories/market-data.repository';
import { getCurrencySnapshot } from './currency.use-cases';
vi.mock('@/lib/currency/frankfurter', () => ({ fetchExchangeRates: vi.fn() }));
vi.mock('@/server/repositories/market-data.repository', () => ({
  MarketDataRepository: { findBySymbols: vi.fn() },
}));
beforeEach(() => vi.resetAllMocks());
it('loads only real rates for every supported display currency', async () => {
  vi.mocked(fetchExchangeRates).mockResolvedValue([
    { base: 'EUR', quote: 'USD', rate: 1.2, date: '2026-11-02' },
  ]);
  expect(await getCurrencySnapshot('USD')).toEqual({
    currency: 'USD',
    rates: { USD: { base: 'EUR', quote: 'USD', rate: 1.2, date: '2026-11-02' } },
  });
});
it('uses a dated cached quote during an outage and leaves missing rates unavailable', async () => {
  vi.mocked(fetchExchangeRates).mockRejectedValue(new Error('offline'));
  vi.mocked(MarketDataRepository.findBySymbols).mockResolvedValue([
    { symbol: 'EUR/USD', data: [{ datetime: '2026-10-30', close: '1.1' }] },
  ]);
  const cached = await getCurrencySnapshot('USD');
  expect(cached.rates.USD).toEqual({ base: 'EUR', quote: 'USD', rate: 1.1, date: '2026-10-30' });
  expect(cached.rates.GBP).toBeUndefined();
  vi.mocked(MarketDataRepository.findBySymbols).mockRejectedValue(new Error('db unavailable'));
  expect(await getCurrencySnapshot('GBP')).toEqual({ currency: 'GBP', rates: {} });
});
