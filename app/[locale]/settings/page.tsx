/**
 * Settings Page - Server Component
 */

import { Suspense } from 'react';
import { requireUserAuth } from '@/lib/auth/page-auth';
import { getUserPreferencesUseCase } from '@/server/use-cases/users/get-user-preferences.use-case';
import SettingsContent from './settings-content';
import { SettingsPageSkeleton } from '@/components/ui/primitives/skeletons/settings-skeletons';
import { withTimeout } from '@/lib/utils/with-timeout';
import type { UserPreferences } from '@/lib/types';

export default async function SettingsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser } = await requireUserAuth(params);

  const now = new Date();
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

  const preferencesPromise = withTimeout(
    getUserPreferencesUseCase(currentUser.id),
    2500,
    fallbackPreferences,
    'userPreferences'
  );

  return (
    <Suspense fallback={<SettingsPageSkeleton />}>
      <SettingsContent currentUser={currentUser} preferencesPromise={preferencesPromise} />
    </Suspense>
  );
}
