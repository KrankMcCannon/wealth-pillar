import { fetchExchangeRates } from '@/lib/currency/frankfurter';
import { isCurrency, type CurrencySnapshot } from '@/lib/currency/types';
import { MarketDataRepository } from '@/server/repositories/market-data.repository';
import { latestQuoteDate, validSeriesValues } from '@/lib/types/market-data.types';

export async function getCurrencySnapshot(currency: string): Promise<CurrencySnapshot> {
  const snapshot: CurrencySnapshot = {
    currency: isCurrency(currency) ? currency : 'EUR',
    rates: {},
  };
  try {
    for (const row of await fetchExchangeRates()) {
      if (isCurrency(row.quote)) snapshot.rates[row.quote] = row;
    }
  } catch {
    // A dated, persisted daily rate remains usable during a provider outage.
    try {
      for (const row of await MarketDataRepository.findBySymbols([
        'EUR/USD',
        'EUR/GBP',
        'EUR/CHF',
      ])) {
        const quote = row.symbol.split('/')[1];
        const date = latestQuoteDate(row.data);
        const point = validSeriesValues(row.data).find((p) => p.datetime === date);
        if (isCurrency(quote) && date && point)
          snapshot.rates[quote] = { base: 'EUR', quote, date, rate: Number(point.close) };
      }
    } catch {
      /* No rate is displayed as unavailable, never as parity. */
    }
  }
  return snapshot;
}
