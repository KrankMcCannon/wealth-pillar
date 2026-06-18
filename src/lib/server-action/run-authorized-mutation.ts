import { isAuthDenial, requireAuthenticatedUser } from '@/lib/permissions/action-auth';
import type { User } from '@/lib/types';
import type { ServiceResult } from '@/lib/types/service-result';

type AuthDenial = ServiceResult<never>;

export async function runAuthorizedMutation<T>(options: {
  unauthenticatedError: string;
  authorize?: (user: User) => AuthDenial | null | void | Promise<AuthDenial | null | void>;
  mutate: (user: User) => Promise<T>;
  formatError?: (error: unknown) => string;
}): Promise<ServiceResult<T>> {
  try {
    const auth = await requireAuthenticatedUser(options.unauthenticatedError);
    if (isAuthDenial(auth)) return auth;

    const denial = await options.authorize?.(auth);
    if (denial) return denial;

    const data = await options.mutate(auth);
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        options.formatError?.(error) ??
        (error instanceof Error ? error.message : 'Unexpected error'),
    };
  }
}
