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
  datetime?: string;
  time?: string;
  date?: string;
  open?: string | number;
  high?: string | number;
  low?: string | number;
  close: string | number;
  volume?: string | number;
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
  return raw.split(' ')[0].split('T')[0];
}

/**
 * Extract date from a time series entry
 */
export function extractDateFromEntry(entry: TimeSeriesEntry): string {
  const raw = entry?.datetime ?? entry?.time ?? entry?.date ?? '';
  return String(raw).split(' ')[0].split('T')[0];
}

/**
 * Get the latest close price from a time series
 */
export function getLatestCloseFromSeries(data: unknown): number {
  if (!Array.isArray(data) || data.length === 0) return 0;

  const typedData = data as TimeSeriesEntry[];
  const latest = typedData.reduce((acc, current) => {
    return extractDateFromEntry(current) > extractDateFromEntry(acc) ? current : acc;
  }, typedData[0]);

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
    const data = Array.isArray(row?.data) ? row.data : [];
    if (!symbol || data.length === 0) continue;

    const points = data
      .map((entry) => {
        const date = extractDateFromEntry(entry);
        const close = Number.parseFloat(String(entry?.close));
        return {
          date,
          close: Number.isFinite(close) ? close : 0,
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
): number {
  if (!points || points.length === 0) return 0;
  if (!targetDateKey) return points.at(-1)?.close ?? 0;

  let found = false;
  let close = 0;

  for (const point of points) {
    if (point.date <= targetDateKey) {
      close = point.close;
      found = true;
    } else {
      break;
    }
  }

  if (found) return close;
  return points[0]?.close ?? 0;
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
