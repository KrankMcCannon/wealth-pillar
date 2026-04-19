/**
 * Settings Page - Server Component
 */

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { requirePageAuth } from '@/lib/auth/page-auth';
import { getAccountCountByUserUseCase } from '@/server/use-cases/accounts/account.use-cases';
import { getTransactionCountByUserUseCase } from '@/server/use-cases/transactions/get-transactions.use-case';
import { getUserPreferencesUseCase } from '@/server/use-cases/users/get-user-preferences.use-case';
import SettingsContent from './settings-content';
import { PageLoader } from '@/components/shared';
import { withTimeout } from '@/lib/utils/with-timeout';
import type { UserPreferences } from '@/lib/types';

export default async function SettingsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const [{ currentUser, groupUsers }, t] = await Promise.all([
    requirePageAuth(params),
    getTranslations('SettingsPage'),
  ]);

  const now = new Date().toISOString();
  const fallbackPreferences: UserPreferences = {
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

  // Build a single streaming promise for the slower per-user counts and preferences.
  // groupUsers is already resolved above (from cached getGroupUsers — no extra DB round-trip).
  const settingsDataPromise = Promise.all([
    withTimeout(getAccountCountByUserUseCase(currentUser.id), 2000, 0, 'accountCount'),
    withTimeout(getTransactionCountByUserUseCase(currentUser.id), 2000, 0, 'transactionCount'),
    withTimeout(
      getUserPreferencesUseCase(currentUser.id),
      2500,
      fallbackPreferences,
      'userPreferences'
    ),
  ]).then(([accountCount, transactionCount, preferences]) => ({
    accountCount,
    transactionCount,
    preferences,
  }));

  return (
    <Suspense fallback={<PageLoader message={t('loading')} />}>
      <SettingsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        settingsDataPromise={settingsDataPromise}
      />
    </Suspense>
  );
}
