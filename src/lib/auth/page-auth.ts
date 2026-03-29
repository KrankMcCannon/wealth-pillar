/**
 * Page Auth Utilities
 *
 * Centralized helper for the common "resolve params → auth → redirect" pattern
 * shared across all authenticated dashboard pages.
 *
 * Eliminates the 4-line boilerplate repeated in every page.tsx and ensures
 * auth behavior is applied uniformly.
 */

import { redirect } from 'next/navigation';
import { getCurrentUser, getGroupUsers } from './cached-auth';
import type { User } from '@/lib/types';

export interface PageAuthResult {
  locale: string;
  currentUser: User;
  groupUsers: User[];
}

/**
 * Resolves locale from Next.js async params, verifies authentication and
 * returns `currentUser` + `groupUsers` in one call.
 *
 * Redirects to `/<locale>/sign-in` when not authenticated.
 *
 * Both `getCurrentUser` and `getGroupUsers` are request-scoped via React
 * `cache()` so calling this helper is free when the layout has already
 * resolved the same data.
 *
 * @example
 * export default async function MyPage({ params }) {
 *   const { locale, currentUser, groupUsers } = await requirePageAuth(params);
 *   // ...
 * }
 */
export async function requirePageAuth(
  params: Promise<{ locale: string }>
): Promise<PageAuthResult> {
  const { locale } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/${locale}/sign-in`);
  }

  const groupUsers = await getGroupUsers();

  return { locale, currentUser, groupUsers };
}

/**
 * Ensures the signed-in user belongs to a group before loading group-scoped data.
 * Throws if missing so the route `error.tsx` can surface a clear recovery UI.
 */
export function requireGroupId(currentUser: User): string {
  const id = currentUser.group_id?.trim();
  if (!id) {
    throw new Error('Group ID is required');
  }
  return id;
}

/**
 * Variant that only resolves auth without fetching group users.
 * Use on pages that don't need `groupUsers` (e.g. settings-only paths).
 */
export async function requireUserAuth(
  params: Promise<{ locale: string }>
): Promise<{ locale: string; currentUser: User }> {
  const { locale } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/${locale}/sign-in`);
  }

  return { locale, currentUser };
}
