import { getCloseForDate, type ParsedSeriesPoint } from '@/lib/types/market-data.types';

/** Prices are quoted in the position currency; all account costs remain in EUR. */
export function conversionSymbol(currency: string): string | null {
  return ['USD', 'GBP', 'CHF'].includes(currency) ? `${currency}/EUR` : null;
}

export function portfolioMarketSymbols(rows: { symbol: string; currency: string }[]): string[] {
  return [
    ...new Set(
      rows.flatMap((row) =>
        [row.symbol.toUpperCase(), conversionSymbol(row.currency)].filter((s): s is string =>
          Boolean(s)
        )
      )
    ),
  ];
}

export function valuationRate(
  currency: string,
  day: string,
  series: Record<string, ParsedSeriesPoint[]>
): number | null {
  if (currency === 'EUR') return 1;
  const symbol = conversionSymbol(currency);
  return symbol ? getCloseForDate(series[symbol], day) : null;
}
