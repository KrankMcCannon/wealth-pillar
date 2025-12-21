/**
 * Reports Page - Server Component
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { PageDataService } from '@/lib/services';
import { PageLoader } from '@/src/components/shared';
import ReportsContent from './reports-content';

export default async function ReportsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch all reports page data in parallel with centralized service
  const { data, error } = await PageDataService.getReportsPageData(currentUser.group_id);

  if (error) {
    console.error('Failed to fetch reports page data:', error);
  }

  const { accounts = [], transactions = [], categories = [] } = data || {};

  return (
    <Suspense fallback={<PageLoader message="Caricamento report..." />}>
      <ReportsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        transactions={transactions}
        categories={categories}
      />
    </Suspense>
  );
}
