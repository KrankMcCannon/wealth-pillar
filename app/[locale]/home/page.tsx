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
import HomeContent from './home-content';
import HomePageLoading from './loading';

export default async function HomePage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;

  // Use cached auth - same data as layout, no extra DB calls
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/${locale}/sign-in`);
  }

  // Get group users (cached per request)
  const groupUsers = await getGroupUsers();

  // Fetch page-specific data (accounts, transactions, budgets, etc.)
  const dashboardData = await PageDataService.getDashboardData(currentUser.group_id || '');

  const {
    accounts = [],
    accountBalances = {},
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
    <Suspense fallback={<HomePageLoading />}>
      <HomeContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        accountBalances={accountBalances}
        budgets={budgets}
        budgetPeriods={budgetPeriods}
        recurringSeries={recurringSeries}
        budgetsByUser={budgetsByUser}
        investmentSummary={investmentSummary}
      />
    </Suspense>
  );
}
