/**
 * Dashboard Page - Server Component
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { PageDataService } from '@/server/services';
import DashboardContent from './dashboard-content';
import DashboardPageLoading from './loading';

export default async function DashboardPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch all dashboard data in parallel with centralized service
  const dashboardData = await PageDataService.getDashboardData(currentUser.group_id || '');

  const {
    accounts = [],
    accountBalances = {},
    transactions = [],
    budgets = [],
    budgetPeriods = {},
    recurringSeries = [],
  } = dashboardData;

  return (
    <Suspense fallback={<DashboardPageLoading />}>
      <DashboardContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        accountBalances={accountBalances}
        transactions={transactions}
        budgets={budgets}
        budgetPeriods={budgetPeriods}
        recurringSeries={recurringSeries}
      />
    </Suspense>
  );
}
