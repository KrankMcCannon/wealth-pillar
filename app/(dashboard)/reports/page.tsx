/**
 * Reports Page - Server Component
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import { PageDataService } from '@/server/services';
import { PageLoader } from '@/components/shared';
import { getUserPeriodsAction } from '@/features/budgets/actions/budget-period-actions';
import ReportsContent from './reports-content';

export default async function ReportsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/auth');
  const groupUsers = await getGroupUsers();

  // Fetch all reports page data in parallel with centralized service
  const pageData = await PageDataService.getReportsPageData(currentUser.group_id || '');

  const {
    accounts = [],
    transactions = [],
    categories = [],
  } = pageData;

  // Fetch all budget periods for all users in the group
  const budgetPeriodsPromises = groupUsers.map((user) => getUserPeriodsAction(user.id));
  const budgetPeriodsResults = await Promise.all(budgetPeriodsPromises);

  // Flatten results into a single array
  const allBudgetPeriods = budgetPeriodsResults.flatMap((result) => result.data || []);

  return (
    <Suspense fallback={<PageLoader message="Caricamento report..." />}>
      <ReportsContent
        accounts={accounts}
        transactions={transactions}
        categories={categories}
        budgetPeriods={allBudgetPeriods}
        currentUser={currentUser}
        groupUsers={groupUsers}
      />
    </Suspense>
  );
}
