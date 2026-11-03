import type { ExchangeRate } from './types';
const API = 'https://api.frankfurter.dev/v2';

/** Only currency codes and dates leave the server; no amounts or personal data. */
export async function fetchExchangeRates(
  base = 'EUR',
  quotes = ['USD', 'GBP', 'CHF'],
  date?: string,
  from?: string
): Promise<ExchangeRate[]> {
  const query = new URLSearchParams({ base, quotes: quotes.join(',') });
  if (date) query.set('date', date);
  if (from) {
    query.set('from', from);
    query.set('to', new Date().toISOString().slice(0, 10));
  }
  const response = await fetch(`${API}/rates?${query}`, {
    signal: AbortSignal.timeout(5000),
    next: { revalidate: 3600 },
  }).catch(() => {
    throw new Error('EXCHANGE_RATE_UNAVAILABLE');
  });
  if (!response.ok) throw new Error('EXCHANGE_RATE_UNAVAILABLE');
  const raw: unknown = await response.json().catch(() => {
    throw new Error('EXCHANGE_RATE_UNAVAILABLE');
  });
  const today = new Date().toISOString().slice(0, 10);
  const rows = (Array.isArray(raw) ? raw : []).filter((row): row is ExchangeRate => {
    if (!row || typeof row !== 'object') return false;
    const r = row as ExchangeRate;
    return (
      r.base === base &&
      quotes.includes(r.quote) &&
      typeof r.rate === 'number' &&
      Number.isFinite(r.rate) &&
      r.rate > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(r.date) &&
      r.date <= (date ?? today) &&
      Number.isFinite(new Date(`${r.date}T00:00:00Z`).getTime()) &&
      new Date(`${r.date}T00:00:00Z`).toISOString().slice(0, 10) === r.date
    );
  });
  if (!rows.length) throw new Error('EXCHANGE_RATE_UNAVAILABLE');
  return rows;
}

export async function historicalPurchaseRate(currency: string, day: string): Promise<number> {
  if (currency === 'EUR') return 1;
  if (
    !['USD', 'GBP', 'CHF'].includes(currency) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    day > new Date().toISOString().slice(0, 10)
  )
    throw new Error('EXCHANGE_RATE_UNAVAILABLE');
  const rows = await fetchExchangeRates(currency, ['EUR'], day);
  const rate = rows.sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!rate) throw new Error('EXCHANGE_RATE_UNAVAILABLE');
  return rate.rate;
}
