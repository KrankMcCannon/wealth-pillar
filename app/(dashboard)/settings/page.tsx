/**
 * Settings Page - Server Component
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import SettingsContent from './settings-content';
import { PageLoader } from '@/src/components/shared';

export default async function SettingsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  return (
    <Suspense fallback={<PageLoader message="Caricamento impostazioni..." />}>
      <SettingsContent currentUser={currentUser} groupUsers={groupUsers} />
    </Suspense>
  );
}
