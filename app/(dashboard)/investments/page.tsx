/**
 * Investments Page - Server Component
 */

import { Suspense } from 'react';
import InvestmentsContent from './investments-content';
import { PageLoader } from '@/src/components/shared';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';

export default async function InvestmentsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  return (
    <Suspense fallback={<PageLoader message="Caricamento investimenti..." />}>
      <InvestmentsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
      />
    </Suspense>
  );
}
