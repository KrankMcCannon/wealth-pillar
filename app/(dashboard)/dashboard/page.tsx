/**
 * Dashboard Page - Server Component
 *
 * Uses request-scoped cached auth to avoid redundant database calls.
 * User and group data are cached per-request, shared with layout.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import { PageDataService } from '@/server/services';
import DashboardContent from './dashboard-content';
import DashboardPageLoading from './loading';

export default async function DashboardPage() {
  // Use cached auth - same data as layout, no extra DB calls
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/auth');
  }

  // Get group users (cached per request)
  const groupUsers = await getGroupUsers();

  // Fetch page-specific data (accounts, transactions, budgets, etc.)
  const dashboardData = await PageDataService.getDashboardData(currentUser.group_id || '');

  const {
    accounts = [],
    accountBalances = {},
    transactions = [],
    budgets = [],
    budgetPeriods = {},
    recurringSeries = [],
    budgetsByUser = {},
    investments = {},
  } = dashboardData;

  // Get current user's investment summary for header
  const userInvestmentData = investments[currentUser.id];
  const investmentSummary = userInvestmentData?.summary || null;

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
        budgetsByUser={budgetsByUser}
        investmentSummary={investmentSummary}
      />
    </Suspense>
  );
}
