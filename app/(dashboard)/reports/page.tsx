/**
 * Reports Page - Server Component
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import { PageDataService } from '@/server/services';
import { PageLoader } from '@/components/shared';
import ReportsContent from './reports-content';

export default async function ReportsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/auth');
  const groupUsers = await getGroupUsers();

  // Fetch all reports page data in parallel with centralized service
  const pageData = await PageDataService.getReportsPageData(currentUser.group_id || '');

  const {
    accounts = [],
    categories = [],
    enrichedBudgetPeriods = [],
    overviewMetrics,
    annualSpending,
  } = pageData;

  return (
    <Suspense fallback={<PageLoader message="Caricamento report..." />}>
      <ReportsContent
        accounts={accounts}
        categories={categories}
        enrichedBudgetPeriods={enrichedBudgetPeriods}
        overviewMetrics={overviewMetrics}
        annualSpending={annualSpending}
        currentUser={currentUser}
        groupUsers={groupUsers}
      />
    </Suspense>
  );
}
