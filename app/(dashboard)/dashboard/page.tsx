/**
 * Dashboard Page - Server Component
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { PageDataService } from '@/lib/services';
import DashboardContent from './dashboard-content';
import DashboardPageLoading from './loading';

export default async function DashboardPage() {
  const { currentUser } = await getDashboardData();

  // Fetch all dashboard data in parallel with centralized service
  const { data, error } = await PageDataService.getDashboardData(currentUser.group_id);

  if (error) {
    console.error('Failed to fetch dashboard data:', error);
  }

  const {
    accountBalances = {},
    transactions = [],
    budgets = [],
    budgetPeriods = new Map(),
    recurringSeries = [],
  } = data || {};

  return (
    <Suspense fallback={<DashboardPageLoading />}>
      <DashboardContent
        accountBalances={accountBalances}
        transactions={transactions}
        budgets={budgets}
        budgetPeriods={budgetPeriods}
        recurringSeries={recurringSeries}
      />
    </Suspense>
  );
}
