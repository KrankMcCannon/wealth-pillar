/**
 * Page Auth Utilities
 *
 * Centralized helper for the common "resolve params → auth → redirect" pattern
 * shared across all authenticated dashboard pages.
 */

import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser, getGroupUsers, getAuth } from './cached-auth';
import { isOnboardingComplete } from './clerk-session';
import { getSelectableUsers } from '@/lib/utils/permissions';
import { withTimeout } from '@/lib/utils/with-timeout';
import type { User } from '@/lib/types';

export interface PageAuthResult {
  locale: string;
  currentUser: User;
  groupUsers: User[];
}

async function redirectUnauthenticated(locale: string): Promise<never> {
  const { userId: clerkId } = await getAuth();
  if (clerkId) {
    redirect(`/${locale}/onboarding`);
  }
  redirect(`/${locale}/sign-in`);
}

/**
 * Resolves locale from Next.js async params, verifies authentication and
 * returns `currentUser` + `groupUsers` in one call.
 *
 * Redirects to onboarding when Clerk session exists but profile is incomplete;
 * otherwise to sign-in.
 */
export async function requirePageAuth(
  params: Promise<{ locale: string }>
): Promise<PageAuthResult> {
  const { locale } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return redirectUnauthenticated(locale);
  }

  if (!isOnboardingComplete(currentUser)) {
    redirect(`/${locale}/onboarding`);
  }

  const allGroupUsers = await withTimeout(getGroupUsers(), 1500, [currentUser]);
  const groupUsers = getSelectableUsers(currentUser, allGroupUsers);

  return { locale, currentUser, groupUsers };
}

/**
 * Ensures the signed-in user belongs to a group before loading group-scoped data.
 * Throws a localized message so route `error.tsx` can show human-readable copy.
 */
export async function requireGroupId(currentUser: User): Promise<string> {
  const id = currentUser.group_id?.trim();
  if (!id) {
    const t = await getTranslations('Errors');
    throw new Error(t('groupRequired'));
  }
  return id;
}

/**
 * Variant that only resolves auth without fetching group users.
 */
export async function requireUserAuth(
  params: Promise<{ locale: string }>
): Promise<{ locale: string; currentUser: User }> {
  const { locale } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return redirectUnauthenticated(locale);
  }

  if (!isOnboardingComplete(currentUser)) {
    redirect(`/${locale}/onboarding`);
  }

  return { locale, currentUser };
}
