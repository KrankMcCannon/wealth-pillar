import { setTimeout as delay } from 'node:timers/promises';

const TRANSIENT_READ_CODES = new Set([
  'QUEUE_TIMEOUT',
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
    if (cause.code === '57014' && /statement timeout/i.test(cause.message ?? '')) return true;
    if (cause.code && TRANSIENT_READ_CODES.has(cause.code)) return true;
    error = cause.cause;
  }
  return false;
}

/** One fresh attempt for standalone reads only. Never wrap writes or an active transaction. */
export async function readWithRetry<T>(read: () => PromiseLike<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (!isTransientReadError(error)) throw error;
    await delay(150);
    return await read();
  }
}
