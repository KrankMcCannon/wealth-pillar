import { isCurrency } from '../src/lib/currency/types';
import { fetchExchangeRates } from '../src/lib/currency/frankfurter';
import { db } from '../src/server/db/drizzle';
import { investments, availableShares } from '../src/server/db/schema';
import { MarketDataRepository } from '../src/server/repositories/market-data.repository';

import { validSeriesValues } from '../src/lib/types/market-data.types';
import { portfolioMarketSymbols } from '../src/server/use-cases/investments/currency-conversion';

const BASE_URL = 'https://api.twelvedata.com';
const DEFAULT_INTERVAL = '1day';
const DEFAULT_OUTPUTSIZE = 365 * 2;

const { TWELVE_DATA_API_KEY } = process.env;

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    symbols: [] as string[],
    from: 'investments',
    limit: 0,
    interval: DEFAULT_INTERVAL,
    outputsize: DEFAULT_OUTPUTSIZE,
    dryRun: false,
  };

  args.forEach((arg) => {
    if (arg.startsWith('--symbols=')) {
      const raw = arg.split('=')[1] || '';
      options.symbols = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (arg.startsWith('--from=')) {
      options.from = arg.split('=')[1] || options.from;
    } else if (arg.startsWith('--limit=')) {
      options.limit = Number(arg.split('=')[1]) || 0;
    } else if (arg.startsWith('--interval=')) {
      options.interval = arg.split('=')[1] || options.interval;
    } else if (arg.startsWith('--outputsize=')) {
      options.outputsize = Number(arg.split('=')[1]) || options.outputsize;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  });

  return options;
};

const fetchSymbols = async (from: string, limit: number) => {
  const table = from === 'available_shares' ? availableShares : investments;
  const query = db.selectDistinct({ symbol: table.symbol }).from(table);
  const data = limit > 0 ? await query.limit(limit) : await query;
  const symbols = (data || []).map((row) => row.symbol).filter(Boolean);
  const currencies =
    from === 'available_shares'
      ? []
      : await db.selectDistinct({ currency: investments.currency }).from(investments);
  return portfolioMarketSymbols([
    ...symbols.map((symbol) => ({ symbol: String(symbol), currency: 'EUR' })),
    ...currencies.map(({ currency }) => ({ symbol: '', currency })),
  ]).filter(Boolean);
};

const fetchTimeSeries = async (symbol: string, interval: string, outputsize: number) => {
  const [base, quote] = symbol.split('/');
  if (isCurrency(base) && isCurrency(quote)) {
    const from = new Date();
    from.setUTCFullYear(from.getUTCFullYear() - 2);
    return (
      await fetchExchangeRates(base, [quote], undefined, from.toISOString().slice(0, 10))
    ).map((row) => ({ datetime: row.date, close: row.rate }));
  }
  if (!TWELVE_DATA_API_KEY) throw new Error('Missing Twelve Data API key for stock prices');
  const url = `${BASE_URL}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${symbol}`);
  }
  const json = await res.json();
  if (json.status === 'error') {
    throw new Error(`TwelveData error for ${symbol}: ${JSON.stringify(json)}`);
  }
  const values = validSeriesValues(json.values);
  if (!values.length) throw new Error(`No valid quotes for ${symbol}`);
  return values;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  const options = parseArgs();
  const symbols =
    options.symbols.length > 0
      ? Array.from(new Set(options.symbols.map((s) => s.toUpperCase())))
      : await fetchSymbols(options.from, options.limit);

  for (const pair of ['EUR/USD', 'EUR/GBP', 'EUR/CHF'])
    if (!symbols.includes(pair)) symbols.push(pair);

  if (symbols.length === 0) {
    process.stdout.write('No symbols found to update.\n');
    return;
  }

  process.stdout.write(`Updating ${symbols.length} symbols from ${options.from}...\n`);

  let failureCount = 0;

  for (const symbol of symbols) {
    try {
      const series = await fetchTimeSeries(symbol, options.interval, options.outputsize);
      if (options.dryRun) {
        process.stdout.write(`[DRY] ${symbol}: ${series.length} rows\n`);
      } else {
        await MarketDataRepository.upsert(symbol, series);
        process.stdout.write(`[OK] ${symbol}: ${series.length} rows\n`);
      }
      await sleep(250); // Basic throttling for free tier
    } catch (error) {
      failureCount += 1;
      console.error(`[ERR] ${symbol}:`, error instanceof Error ? error.message : 'Fetch failed');
    }
  }

  if (failureCount > 0) {
    process.exitCode = 1;
  }
};

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : 'Market refresh failed');
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
