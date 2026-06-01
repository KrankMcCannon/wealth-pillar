import { getAuth } from './cached-auth';
import type { User } from '@/lib/types';

/** Onboarding is complete when the user belongs to a group. */
export function isOnboardingComplete(user: Pick<User, 'group_id'> | null | undefined): boolean {
  return Boolean(user?.group_id?.trim());
}

/**
 * Returns the authenticated Clerk user id or null when there is no session.
 */
export async function getAuthenticatedClerkId(): Promise<string | null> {
  const { userId } = await getAuth();
  return userId ?? null;
}

/**
 * Requires an active Clerk session. Use in server actions that must not trust client-supplied clerk ids.
 */
export async function requireAuthenticatedClerkId(): Promise<string | null> {
  return getAuthenticatedClerkId();
}
