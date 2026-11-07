/** A deadline releases the caller; it does NOT cancel a server-side mutation. */
export const ACTION_TIMEOUT_MS = 20_000;

export class ActionTimeoutError extends Error {
  constructor() {
    super('ACTION_TIMEOUT');
    this.name = 'ActionTimeoutError';
  }
}

export async function withDeadline<T>(
  promise: Promise<T>,
  timeoutMs = ACTION_TIMEOUT_MS
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new ActionTimeoutError()), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function isTechnicalError(message: string): boolean {
  return /failed query:|failed to fetch|fetch failed|networkerror|load failed|network request failed|connection_closed|connect_timeout|statement timeout/i.test(
    message
  );
}
