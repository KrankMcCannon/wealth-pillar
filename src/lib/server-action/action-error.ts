import { ActionTimeoutError, isTechnicalError } from '@/lib/utils/with-deadline';

/** Error messages and driver error objects may contain SQL and parameters. */
export function logServerActionError(operation: string, error: unknown): void {
  const code =
    (error as { code?: unknown; cause?: { code?: unknown } } | null)?.cause?.code ??
    (error as { code?: unknown } | null)?.code;
  console.error('[ServerAction]', {
    operation,
    code: typeof code === 'string' && /^[A-Z0-9_]{5,40}$/.test(code) ? code : undefined,
  });
}

/** Preserve domain validation messages, but keep SQL and parameters on the server. */
export function actionErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  if (error instanceof ActionTimeoutError || isTechnicalError(error.message)) {
    const cause = error.cause as { code?: string; name?: string } | undefined;
    console.error('[ServerAction] Infrastructure failure', {
      name: error.name,
      causeName: cause?.name,
      code: cause?.code,
    });
    return fallback;
  }
  return error.message;
}
