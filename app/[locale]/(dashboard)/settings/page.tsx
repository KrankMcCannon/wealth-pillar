/**
 * Settings Page - Server Component
 *
 * Route `loading.tsx` is the navigation fallback. Do not wrap this file in Suspense.
 */

import { requireUserAuth } from '@/lib/auth/page-auth';
import { getUserPreferencesUseCase } from '@/server/use-cases/users/get-user-preferences.use-case';
import { getGroupByIdUseCase } from '@/server/use-cases/groups/groups.use-cases';
import SettingsContent from './settings-content';
import { withTimeout } from '@/lib/utils/with-timeout';
import type { UserPreferences } from '@/lib/types';

async function SettingsPageData({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser } = await requireUserAuth(params);

  const fallbackPreferences: UserPreferences = {
    id: `fallback-${currentUser.id}`,
    user_id: currentUser.id,
    currency: 'EUR',
    language: 'it-IT',
    timezone: 'Europe/Rome',
    notifications_push: true,
    notifications_email: false,
    notifications_budget_alerts: true,
    created_at: '1970-01-01T00:00:00.000Z',
    updated_at: '1970-01-01T00:00:00.000Z',
  };

  const [initialPreferences, group] = await Promise.all([
    withTimeout(
      getUserPreferencesUseCase(currentUser.id),
      2500,
      fallbackPreferences,
      'userPreferences'
    ),
    currentUser.group_id
      ? withTimeout(getGroupByIdUseCase(currentUser.group_id), 2500, null, 'groupName')
      : Promise.resolve(null),
  ]);
  const initialGroupName = group?.name ?? '';

  return (
    <SettingsContent
      currentUser={currentUser}
      initialPreferences={initialPreferences}
      initialGroupName={initialGroupName}
    />
  );
}

export default function SettingsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  return <SettingsPageData params={params} />;
}
