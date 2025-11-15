/**
 * Reports Page - Server Component
 * Uses shared utility for consistent data fetching across all dashboard pages
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import ReportsContent from './reports-content';
import { PageLoader } from '@/src/components/shared';

export default async function ReportsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  return (
    <Suspense fallback={<PageLoader message="Caricamento report..." />}>
      <ReportsContent currentUser={currentUser} groupUsers={groupUsers} />
    </Suspense>
  );
}
