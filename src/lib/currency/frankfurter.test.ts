import { afterEach, expect, it, vi } from 'vitest';
import { fetchExchangeRates, historicalPurchaseRate } from './frankfurter';
afterEach(() => vi.unstubAllGlobals());
it('uses dated historical rates without a token, amount or user data', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      Response.json([{ base: 'USD', quote: 'EUR', date: '2026-10-30', rate: 0.86 }])
    );
  vi.stubGlobal('fetch', fetcher);
  expect(await historicalPurchaseRate('USD', '2026-10-31')).toBe(0.86);
  const url = new URL(fetcher.mock.calls[0]![0]);
  expect(url.hostname).toBe('api.frankfurter.dev');
  expect(Object.fromEntries(url.searchParams)).toEqual({
    base: 'USD',
    quotes: 'EUR',
    date: '2026-10-31',
  });
});
it.each(
  [
    [],
    [{ base: 'EUR', quote: 'USD', date: '2026-02-30', rate: 1.2 }],
    [{ base: 'EUR', quote: 'USD', date: '2026-10-30', rate: 0 }],
    [{ base: 'GBP', quote: 'USD', date: '2026-10-30', rate: 1.2 }],
  ].map((rows) => ({ rows }))
)('rejects missing, invalid and mismatched quotes: %j', async ({ rows }) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(rows)));
  await expect(fetchExchangeRates()).rejects.toThrow('EXCHANGE_RATE_UNAVAILABLE');
});
it('does not replace a provider error with a fixed rate', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
  await expect(historicalPurchaseRate('USD', '2026-10-30')).rejects.toThrow(
    'EXCHANGE_RATE_UNAVAILABLE'
  );
  expect(await historicalPurchaseRate('EUR', '2026-10-30')).toBe(1);
});
