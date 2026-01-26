import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const BASE_URL = 'https://api.twelvedata.com';
const DEFAULT_INTERVAL = '1day';
const DEFAULT_OUTPUTSIZE = 365 * 2;

const {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  TWELVE_DATA_API_KEY,
} = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

if (!TWELVE_DATA_API_KEY) {
  throw new Error('Missing Twelve Data env: TWELVE_DATA_API_KEY');
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    symbols: [],
    from: 'investments',
    limit: 0,
    interval: DEFAULT_INTERVAL,
    outputsize: DEFAULT_OUTPUTSIZE,
    dryRun: false,
  };

  args.forEach((arg) => {
    if (arg.startsWith('--symbols=')) {
      const raw = arg.split('=')[1] || '';
      options.symbols = raw.split(',').map(s => s.trim()).filter(Boolean);
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

const fetchSymbols = async (from, limit) => {
  const table = from === 'available_shares' ? 'available_shares' : 'investments';
  let query = supabase.from(table).select('symbol');
  if (limit > 0) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  const symbols = (data || []).map((row) => row.symbol).filter(Boolean);
  return Array.from(new Set(symbols.map((s) => String(s).toUpperCase())));
};

const fetchTimeSeries = async (symbol, interval, outputsize) => {
  const url = `${BASE_URL}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status === 'error') {
    throw new Error(`TwelveData error for ${symbol}: ${JSON.stringify(json)}`);
  }
  return json.values || [];
};

const upsertCache = async (symbol, data) => {
  const { error } = await supabase
    .from('market_data_cache')
    .upsert({
      symbol,
      data,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'symbol' });
  if (error) throw error;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  const options = parseArgs();
  const symbols = options.symbols.length > 0
    ? Array.from(new Set(options.symbols.map((s) => s.toUpperCase())))
    : await fetchSymbols(options.from, options.limit);

  if (symbols.length === 0) {
    process.stdout.write('No symbols found to update.\n');
    return;
  }

  process.stdout.write(`Updating ${symbols.length} symbols from ${options.from}...\n`);

  for (const symbol of symbols) {
    try {
      const series = await fetchTimeSeries(symbol, options.interval, options.outputsize);
      if (options.dryRun) {
        process.stdout.write(`[DRY] ${symbol}: ${series.length} rows\n`);
      } else {
        await upsertCache(symbol, series);
        process.stdout.write(`[OK] ${symbol}: ${series.length} rows\n`);
      }
      await sleep(250); // Basic throttling for free tier
    } catch (error) {
      console.error(`[ERR] ${symbol}:`, error?.message || error);
    }
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
