/**
 * Twelve Data API Client
 * Wraps calls to the Twelve Data API for stock market data.
 */

const API_KEY = process.env.TWELVE_DATA_API_KEY;
const BASE_URL = 'https://api.twelvedata.com';
const REQUEST_TIMEOUT_MS = 4000;

const logNotFound = (response: Response, context: string) => {
  if (response.status === 404) {
    console.warn(`[TwelveData] 404 not found for ${context}`);
    return true;
  }
  return false;
};

const fetchWithTimeout = async (
  url: string,
  revalidate: number,
  context: string
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      next: { revalidate },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`[TwelveData] Request timed out for ${context} after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export interface StockQuote {
  symbol: string;
  name: string;
  exchange: string;
  mic_code: string;
  currency: string;
  datetime: string;
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string; // Current price usually
  volume: string;
  previous_close: string;
  change: string;
  percent_change: string;
  average_volume: string;
  is_market_open: boolean;
}

export interface TimeSeriesData {
  time: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export const twelveData = {
  /**
   * Get real-time quote for a symbol
   */
  async getQuote(symbol: string): Promise<StockQuote | null> {
    if (!API_KEY) {
      console.warn('TWELVE_DATA_API_KEY is not set');
      // Return mock data for development if key is missing?
      // Or just fail. Let's return null.
      return null;
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/quote?symbol=${symbol}&apikey=${API_KEY}`,
        60,
        `quote ${symbol}`
      );

      if (logNotFound(response, `quote ${symbol}`)) {
        return null;
      }

      const data = await response.json();

      if (data.code) {
        // Error response from Twelve Data has a 'code'
        console.error('Twelve Data API Error:', data);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching data from Twelve Data:', error);
      return null;
    }
  },

  /**
   * Get real-time quotes for multiple symbols
   */
  async getQuotes(symbols: string[]): Promise<Record<string, StockQuote>> {
    if (!API_KEY || symbols.length === 0) return {};

    const uniqueSymbols = Array.from(new Set(symbols));
    const symbolString = uniqueSymbols.join(',');

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/quote?symbol=${symbolString}&apikey=${API_KEY}`,
        60,
        `quote ${symbolString}`
      );

      if (logNotFound(response, `quote ${symbolString}`)) {
        return {};
      }

      const data = await response.json();

      if (data.code) {
        console.error('Twelve Data API Error:', data);
        return {};
      }

      // If single symbol, response is the object itself
      if (uniqueSymbols.length === 1) {
        return { [uniqueSymbols[0]]: data };
      }

      // If multiple, response is object keys by symbol
      return data;
    } catch (error) {
      console.error('Error fetching data from Twelve Data:', error);
      return {};
    }
  },

  /**
   * Get time series data (e.g. for charts)
   */
  async getTimeSeries(
    symbol: string,
    interval: string = '1day',
    outputsize: number = 30
  ): Promise<TimeSeriesData[]> {
    if (!API_KEY) return [];

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${API_KEY}`,
        3600,
        `time_series ${symbol}`
      );

      if (logNotFound(response, `time_series ${symbol}`)) {
        return [];
      }

      const data = await response.json();

      if (data.status === 'error') {
        console.error('Twelve Data API Error:', data);
        return [];
      }

      return data.values || [];
    } catch (error) {
      console.error('Error fetching time series:', error);
      return [];
    }
  },
};
