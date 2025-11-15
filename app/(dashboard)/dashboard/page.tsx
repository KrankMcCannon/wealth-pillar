/**
 * Dashboard Page - Server Component
 * Uses shared utility for consistent data fetching across all dashboard pages
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import DashboardContent from './dashboard-content';
import DashboardPageLoading from './loading';

export default async function DashboardPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  return (
    <Suspense fallback={<DashboardPageLoading />}>
      <DashboardContent currentUser={currentUser} groupUsers={groupUsers} />
    </Suspense>
  );
}
