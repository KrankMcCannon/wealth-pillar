/**
 * Settings Page - Server Component
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/cached-auth';
import type { User } from '@/lib/types';
import {
  AccountService,
  TransactionService,
  UserPreferencesService,
  UserService,
} from '@/server/services';
import SettingsContent from './settings-content';
import { PageLoader } from '@/components/shared';

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
  label: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => {
          console.warn(`[SettingsPage] Timeout after ${timeoutMs}ms: ${label}`);
          resolve(fallback);
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    console.error(`[SettingsPage] Fetch failed: ${label}`, error);
    return fallback;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/sign-in');
  const t = await getTranslations('SettingsPage');
  type GroupUsersResult = Awaited<ReturnType<typeof UserService.getUsersByGroup>>;

  const now = new Date().toISOString();
  const fallbackPreferences = {
    id: `fallback-${currentUser.id}`,
    user_id: currentUser.id,
    currency: 'EUR',
    language: 'it-IT',
    timezone: 'Europe/Rome',
    notifications_push: true,
    notifications_email: false,
    notifications_budget_alerts: true,
    created_at: now,
    updated_at: now,
  };

  // Fetch accounts, transactions, preferences, and group users
  const [accountCount, transactionCount, preferences, groupUsersResult] = await Promise.all([
    withTimeout(AccountService.getAccountCountByUser(currentUser.id), 2000, 0, 'accountCount'),
    withTimeout(
      TransactionService.getTransactionCountByUser(currentUser.id),
      2000,
      0,
      'transactionCount'
    ),
    withTimeout(
      UserPreferencesService.getUserPreferences(currentUser.id),
      2500,
      fallbackPreferences,
      'userPreferences'
    ),
    withTimeout(
      currentUser.group_id
        ? UserService.getUsersByGroup(currentUser.group_id)
        : Promise.resolve([] as GroupUsersResult),
      2000,
      [] as GroupUsersResult,
      'groupUsers'
    ),
  ]);

  // Apply the type assertion to the result of the promise, not within Promise.all's arguments
  const groupUsers: User[] = groupUsersResult as User[];

  return (
    <Suspense fallback={<PageLoader message={t('loading')} />}>
      <SettingsContent
        accountCount={accountCount}
        transactionCount={transactionCount}
        currentUser={currentUser}
        preferences={preferences}
        groupUsers={groupUsers}
      />
    </Suspense>
  );
}
