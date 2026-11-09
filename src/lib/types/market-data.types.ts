/**
 * Shared Market Data Types
 *
 * Centralized type definitions for market data operations.
 * Used by investment.service.ts and market-data.service.ts to eliminate `any` types.
 */

/**
 * Raw time series entry from Twelve Data API or market_data_cache
 */
export interface TimeSeriesEntry {
  datetime?: string | undefined;
  time?: string | undefined;
  date?: string | undefined;
  open?: string | number | undefined;
  high?: string | number | undefined;
  low?: string | number | undefined;
  close: string | number;
  volume?: string | number | undefined;
}

/**
 * Market data cache row from Supabase
 */
export interface MarketDataCacheRow {
  symbol: string;
  data: TimeSeriesEntry[];
  last_updated?: string;
}

/**
 * Parsed and normalized series point for calculations
 */
export interface ParsedSeriesPoint {
  date: string;
  close: number;
  exactClose?: string;
}

/**
 * Quote data from API
 */
export interface MarketQuote {
  symbol?: string;
  open?: string | number;
  high?: string | number;
  low?: string | number;
  close?: string | number;
  volume?: string | number;
  datetime?: string;
}

/**
 * Batch market data result
 */
export interface MarketDataBatchResult {
  symbol: string;
  data: TimeSeriesEntry[];
  /** Latest valid quote day, not the time a provider request was attempted. */
  lastUpdated: string | null;
}

// ============================================================================
// Helper Functions (Shared between market-data.service.ts and investment.service.ts)
// ============================================================================

/**
 * Normalize date key from various formats to YYYY-MM-DD
 */
export function normalizeDateKey(value: string | Date | null | undefined): string {
  if (!value) return '';
  const raw = value instanceof Date ? value.toISOString() : String(value);
  const part = raw.split(' ')[0];
  return part?.split('T')[0] ?? '';
}

/**
 * Extract date from a time series entry
 */
export function extractDateFromEntry(entry: TimeSeriesEntry): string {
  const raw = entry?.datetime ?? entry?.time ?? entry?.date ?? '';
  const part = String(raw).split(' ')[0];
  return part?.split('T')[0] ?? '';
}

/**
 * Get the latest close price from a time series
 */
export function getLatestCloseFromSeries(data: unknown): number {
  if (!Array.isArray(data) || data.length === 0) return 0;

  const typedData = validSeriesValues(data);
  const first = typedData[0];
  if (!first) return 0;
  const latest = typedData.reduce((acc, current) => {
    return extractDateFromEntry(current) > extractDateFromEntry(acc) ? current : acc;
  }, first);

  const closeValue = latest?.close;
  const parsed = Number.parseFloat(String(closeValue));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Build a series index mapping symbol to sorted points
 */
export function buildSeriesIndex(
  seriesRows: MarketDataCacheRow[]
): Record<string, ParsedSeriesPoint[]> {
  const index: Record<string, ParsedSeriesPoint[]> = {};

  for (const row of seriesRows) {
    const symbol = String(row?.symbol || '').toUpperCase();
    const data = validSeriesValues(row?.data);
    if (!symbol || data.length === 0) continue;

    const points = data
      .map((entry) => {
        const date = extractDateFromEntry(entry);
        const close = Number(entry?.close);
        return {
          date,
          close: Number.isFinite(close) ? close : 0,
          exactClose: String(entry.close),
        };
      })
      .filter((point) => point.date && point.close > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (points.length > 0) {
      index[symbol] = points;
    }
  }

  return index;
}

/**
 * Get close price for a specific date from sorted points
 */
export function getCloseForDate(
  points: ParsedSeriesPoint[] | undefined,
  targetDateKey?: string
): number | null {
  let close: number | null = null;
  for (const point of points ?? []) {
    if (targetDateKey && point.date > targetDateKey) break;
    if (Number.isFinite(point.close) && point.close > 0) close = point.close;
  }
  return close;
}

/** Decimal source for financial arithmetic; numeric close remains presentation-compatible. */
export function getExactCloseForDate(
  points: ParsedSeriesPoint[] | undefined,
  targetDateKey?: string
): string | null {
  let close: string | null = null;
  for (const point of points ?? []) {
    if (targetDateKey && point.date > targetDateKey) break;
    if (Number.isFinite(point.close) && point.close > 0)
      close = point.exactClose ?? String(point.close);
  }
  return close;
}

/**
 * Normalize time series values to ensure datetime field exists
 */
export function normalizeSeriesValues(values: TimeSeriesEntry[]): TimeSeriesEntry[] {
  return values.map((entry) => {
    if (entry?.datetime) return entry;
    const raw = entry?.time ?? entry?.date;
    if (!raw) return entry;
    const datetime = String(raw).split('T')[0];
    return { ...entry, datetime };
  });
}

/** Only dated, finite positive quotes may enter the cache or financial calculations. */
export function validSeriesValues(values: unknown): TimeSeriesEntry[] {
  if (!Array.isArray(values)) return [];
  const today = new Date().toISOString().slice(0, 10);
  return values.flatMap((entry: TimeSeriesEntry) => {
    if (!entry || typeof entry !== 'object') return [];
    const day = extractDateFromEntry(entry);
    if (typeof entry.close !== 'number' && typeof entry.close !== 'string') return [];
    const close = Number(entry.close);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day > today || !Number.isFinite(close) || close <= 0)
      return [];
    const date = new Date(`${day}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) return [];
    return [{ ...entry, datetime: day }];
  });
}

export function latestQuoteDate(values: unknown): string | null {
  return validSeriesValues(values).reduce<string | null>(
    (latest, point) => (!latest || point.datetime! > latest ? point.datetime! : latest),
    null
  );
}
