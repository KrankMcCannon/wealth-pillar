/**
 * Reports Page - Server Component
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { PageDataService } from '@/lib/services';
import { PageLoader } from '@/src/components/shared';
import { getUserPeriodsAction } from '@/features/budgets/actions/budget-period-actions';
import ReportsContent from './reports-content';

export default async function ReportsPage() {
  const { currentUser } = await getDashboardData();

  // Fetch all reports page data in parallel with centralized service
  const { data, error } = await PageDataService.getReportsPageData(currentUser.group_id);

  if (error) {
    console.error('Failed to fetch reports page data:', error);
  }

  const { accounts = [], transactions = [], categories = [] } = data || {};

  // Fetch all budget periods for the current user
  const { data: budgetPeriods } = await getUserPeriodsAction(currentUser.id);

  return (
    <Suspense fallback={<PageLoader message="Caricamento report..." />}>
      <ReportsContent
        accounts={accounts}
        transactions={transactions}
        categories={categories}
        budgetPeriods={budgetPeriods || []}
      />
    </Suspense>
  );
}
