import { getCurrentUser } from '@/lib/auth/cached-auth';
import { FinancialResourcePolicy } from '@/server/permissions/financial-resource-policy';
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
  return currentUser;
}

/**
 * Returns a permission denial when the caller cannot view the target user's data.
 */
export async function denyUnlessCanViewUser(
  currentUser: User,
  userId: string,
  error: string
): Promise<AuthDenial | null> {
  try {
    // Role checks alone do not establish membership in the authenticated tenant.
    await new FinancialResourcePolicy(currentUser).assertUsers([userId]);
  } catch {
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
