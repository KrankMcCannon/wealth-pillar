import { ActionTimeoutError, isTechnicalError } from '@/lib/utils/with-deadline';

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
