import { setTimeout as delay } from 'node:timers/promises';
import { transactionContext } from './transaction-context';
import { recordDatabaseEvent } from './telemetry';

const TRANSIENT_READ_CODES = new Set([
  'CONNECT_TIMEOUT',
  'CONNECTION_CLOSED',
  'CONNECTION_ENDED',
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  '08000',
  '08003',
  '08006',
  '57P01',
  '57P02',
  '57P03',
]);

function isTransientReadError(error: unknown): boolean {
  const seen = new Set<unknown>();
  while (error && typeof error === 'object' && !seen.has(error)) {
    seen.add(error);
    const cause = error as { code?: string; message?: string; cause?: unknown };
    if (cause.code && TRANSIENT_READ_CODES.has(cause.code)) return true;
    error = cause.cause;
  }
  return false;
}

/** One fresh attempt for standalone reads only. Never wrap writes or an active transaction. */
export async function readWithRetry<T>(
  read: () => PromiseLike<T>,
  options: { deadline?: number } = {}
): Promise<T> {
  if (transactionContext.getStore()) return await read();
  try {
    return await read();
  } catch (error) {
    if (!isTransientReadError(error)) throw error;
    const backoff = 100 + Math.floor(Math.random() * 101);
    // A retry must still have time for connection establishment. Never retry
    // saturation or server cancellation: doing so amplifies the original load.
    if (options.deadline !== undefined && options.deadline - Date.now() < backoff + 5000) {
      throw error;
    }
    recordDatabaseEvent('read.retry');
    await delay(backoff);
    return await read();
  }
}
