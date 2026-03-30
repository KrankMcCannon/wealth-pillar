import { devWarn } from '@/lib/utils/dev-log';

/**
 * Runs a promise with a timeout. If the promise does not resolve within timeoutMs,
 * returns fallback. On rejection, returns fallback. Optional label is used for logging.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
  label?: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => {
          if (label) {
            devWarn(`[withTimeout] Timeout after ${timeoutMs}ms: ${label}`);
          }
          resolve(fallback);
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    if (label) {
      console.error(`[withTimeout] Fetch failed: ${label}`, error);
    }
    return fallback;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
