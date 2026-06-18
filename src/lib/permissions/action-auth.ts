import { getCurrentUser } from '@/lib/auth/cached-auth';
import { AccessScope } from '@/lib/permissions/access-scope';
import type { User } from '@/lib/types';
import type { ServiceResult } from '@/lib/types/service-result';

export type AuthDenial = Pick<ServiceResult<never>, 'data' | 'error'>;

/**
 * Returns the cached current user or a standard unauthenticated ServiceResult error.
 */
export async function requireAuthenticatedUser(
  unauthenticatedError: string
): Promise<User | AuthDenial> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { data: null, error: unauthenticatedError };
  }
  return currentUser as unknown as User;
}

/**
 * Returns a permission denial when the caller cannot view the target user's data.
 */
export function denyUnlessCanViewUser(
  currentUser: User,
  userId: string,
  error: string
): AuthDenial | null {
  if (!AccessScope.for(currentUser).canViewUser(userId)) {
    return { data: null, error };
  }
  return null;
}

export function isAuthDenial<T>(value: T | AuthDenial): value is AuthDenial {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    value.data === null &&
    'error' in value &&
    typeof value.error === 'string'
  );
}
