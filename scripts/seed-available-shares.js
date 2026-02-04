import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const BASE_URL = 'https://api.twelvedata.com';
const DEFAULT_BATCH_SIZE = 1000;
const MAX_SYMBOL_LENGTH = 10;
const US_COUNTRY_NAMES = new Set(['united states', 'united states of america', 'usa', 'us']);

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TWELVE_DATA_API_KEY } = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

if (!TWELVE_DATA_API_KEY) {
  throw new Error('Missing Twelve Data env: TWELVE_DATA_API_KEY');
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const log = (message, options) => {
  if (!options.quiet) {
    process.stdout.write(`${message}\n`);
  }
};

const logVerbose = (message, options) => {
  if (options.verbose && !options.quiet) {
    process.stdout.write(`${message}\n`);
  }
};

const formatError = (error) => {
  if (!error) return 'Unknown error';
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const message = error.message || error.error || error.details;
    if (message) return String(message);
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return String(error);
    }
  }
  return String(error);
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    assets: ['stocks', 'etf', 'forex_pairs', 'cryptocurrencies'],
    batchSize: DEFAULT_BATCH_SIZE,
    dryRun: false,
    verbose: false,
    quiet: false,
  };

  args.forEach((arg) => {
    if (arg.startsWith('--assets=')) {
      const raw = arg.split('=')[1] || '';
      options.assets = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = Number(arg.split('=')[1]) || DEFAULT_BATCH_SIZE;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--quiet') {
      options.quiet = true;
    }
  });

  return options;
};

const buildUrl = (endpoint, params = {}) => {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set('apikey', TWELVE_DATA_API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const fetchEndpoint = async (endpoint) => {
  const res = await fetch(buildUrl(endpoint));
  const json = await res.json();
  if (json?.status === 'error') {
    throw new Error(`Twelve Data error for ${endpoint}: ${JSON.stringify(json)}`);
  }
  return json?.data || json?.result || json;
};

const isUsCountry = (country) => {
  const value = String(country || '').toLowerCase();
  return US_COUNTRY_NAMES.has(value);
};

const toRowsFromStocks = (items) => {
  return (items || [])
    .filter((item) => isUsCountry(item.country))
    .map((item) => ({
      symbol: item.symbol,
      name: item.name || item.symbol,
      region: 'north_america',
      asset_type: 'stock',
      exchange: item.exchange || null,
      currency: item.currency || null,
    }));
};

const toRowsFromEtf = (items) => {
  return (items || [])
    .filter((item) => isUsCountry(item.country))
    .map((item) => ({
      symbol: item.symbol,
      name: item.name || item.symbol,
      region: 'north_america',
      asset_type: 'etf',
      exchange: item.exchange || null,
      currency: item.currency || null,
    }));
};

const toRowsFromForex = (items) => {
  return (items || []).map((item) => ({
    symbol: item.symbol,
    name: item.symbol,
    region: 'global',
    asset_type: 'forex',
    exchange: null,
    currency: item.currency_quote || null,
  }));
};

const toRowsFromCrypto = (items) => {
  return (items || []).map((item) => ({
    symbol: item.symbol,
    name: item.currency_base || item.symbol,
    region: 'global',
    asset_type: 'crypto',
    exchange: Array.isArray(item.available_exchanges) ? item.available_exchanges[0] : null,
    currency: item.currency_quote || null,
  }));
};

const TYPE_PRIORITY = {
  stock: 1,
  etf: 2,
  forex: 3,
  crypto: 4,
};

const normalizeSymbol = (value) =>
  String(value || '')
    .toUpperCase()
    .trim();

const chunk = (items, size) => {
  const batches = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
};

const mergeRows = (rows, deduped, counters) => {
  rows.forEach((row) => {
    const symbol = normalizeSymbol(row.symbol);
    if (!symbol) return;
    if (symbol.length > MAX_SYMBOL_LENGTH) {
      counters.skippedTooLong += 1;
      return;
    }

    const normalized = { ...row, symbol };
    const existing = deduped.get(symbol);
    if (!existing) {
      deduped.set(symbol, normalized);
      return;
    }

    const existingPriority = TYPE_PRIORITY[existing.asset_type] ?? 99;
    const nextPriority = TYPE_PRIORITY[normalized.asset_type] ?? 99;

    if (nextPriority < existingPriority) {
      deduped.set(symbol, normalized);
      return;
    }

    // Keep existing, but fill missing fields
    deduped.set(symbol, {
      ...existing,
      name: existing.name || normalized.name,
      region: existing.region || normalized.region,
      exchange: existing.exchange || normalized.exchange,
      currency: existing.currency || normalized.currency,
    });
  });
};

const upsertRows = async (dedupedMap, batchSize, options) => {
  const rows = Array.from(dedupedMap.values());
  const batches = chunk(rows, batchSize);
  let total = 0;

  for (const batch of batches) {
    if (options.dryRun) {
      logVerbose(`[DRY] Would upsert ${batch.length} rows`, options);
      total += batch.length;
      continue;
    }

    const { error } = await supabase
      .from('available_shares')
      .upsert(batch, { onConflict: 'symbol' });
    if (error) {
      throw new Error(formatError(error));
    }
    total += batch.length;
    logVerbose(`[OK] Upserted ${batch.length} rows`, options);
  }

  log(`[OK] Upserted ${total} rows in ${batches.length} batches`, options);
};

const normalizeAssets = (assets) => {
  const normalized = new Set();
  assets.forEach((asset) => {
    const value = String(asset || '').toLowerCase();
    if (!value) return;
    if (value === 'etfs') {
      normalized.add('etf');
      return;
    }
    if (value === 'forex') {
      normalized.add('forex_pairs');
      return;
    }
    if (value === 'crypto') {
      normalized.add('cryptocurrencies');
      return;
    }
    normalized.add(value);
  });
  return normalized;
};

const main = async () => {
  const options = parseArgs();
  const assets = normalizeAssets(options.assets);

  if (assets.size === 0) {
    log('No assets selected.', options);
    return;
  }

  const deduped = new Map();
  const counters = { skippedTooLong: 0 };

  if (assets.has('stocks')) {
    logVerbose('Fetching stocks...', options);
    const items = await fetchEndpoint('stocks');
    mergeRows(toRowsFromStocks(items), deduped, counters);
  }

  if (assets.has('etf')) {
    logVerbose('Fetching ETFs...', options);
    let items = await fetchEndpoint('etf');
    if (!Array.isArray(items)) {
      items = await fetchEndpoint('etfs');
    }
    mergeRows(toRowsFromEtf(items), deduped, counters);
  }

  if (assets.has('forex_pairs')) {
    logVerbose('Fetching forex pairs...', options);
    const items = await fetchEndpoint('forex_pairs');
    mergeRows(toRowsFromForex(items), deduped, counters);
  }

  if (assets.has('cryptocurrencies')) {
    logVerbose('Fetching cryptocurrencies...', options);
    const items = await fetchEndpoint('cryptocurrencies');
    mergeRows(toRowsFromCrypto(items), deduped, counters);
  }

  if (options.dryRun) {
    log(`[DRY] Prepared ${deduped.size} rows`, options);
  } else {
    log(`Prepared ${deduped.size} rows`, options);
  }

  if (counters.skippedTooLong > 0) {
    log(
      `[SKIP] ${counters.skippedTooLong} rows skipped (symbol length > ${MAX_SYMBOL_LENGTH})`,
      options
    );
  }

  await upsertRows(deduped, options.batchSize, options);
};

main().catch((err) => {
  process.stderr.write(`${formatError(err)}\n`);
  process.exit(1);
});
