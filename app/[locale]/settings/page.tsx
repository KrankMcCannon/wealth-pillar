/**
 * Settings Page - Server Component
 */

import { requireUserAuth } from '@/lib/auth/page-auth';
import { getUserPreferencesUseCase } from '@/server/use-cases/users/get-user-preferences.use-case';
import { getGroupByIdUseCase } from '@/server/use-cases/groups/groups.use-cases';
import SettingsContent from './settings-content';
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

  const initialPreferences = await withTimeout(
    getUserPreferencesUseCase(currentUser.id),
    2500,
    fallbackPreferences,
    'userPreferences'
  );

  let initialGroupName = '';
  if (currentUser.group_id) {
    try {
      const group = await withTimeout(
        getGroupByIdUseCase(currentUser.group_id),
        2500,
        null,
        'groupName'
      );
      initialGroupName = group?.name ?? '';
    } catch {
      initialGroupName = '';
    }
  }

  return (
    <SettingsContent
      currentUser={currentUser}
      initialPreferences={initialPreferences}
      initialGroupName={initialGroupName}
    />
  );
}
