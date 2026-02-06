/**
 * Budgets Page - Server Component
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import { PageDataService } from '@/server/services';
import BudgetsContent from './budgets-content';
import { BudgetSelectorSkeleton } from '@/features/budgets/components';

export default async function BudgetsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/sign-in');
  const groupUsers = await getGroupUsers();

  // Fetch all budget page data in parallel (optimized with Promise.all)
  const pageData = await PageDataService.getBudgetsPageData(currentUser.group_id || '');

  const {
    budgets = [],
    transactions = [],
    accounts = [],
    categories = [],
    budgetPeriods = {},
    budgetsByUser = {},
  } = pageData;

  return (
    <Suspense fallback={<BudgetSelectorSkeleton />}>
      <BudgetsContent
        categories={categories || []}
        budgets={budgets || []}
        transactions={transactions || []}
        accounts={accounts || []}
        budgetPeriods={budgetPeriods}
        currentUser={currentUser}
        groupUsers={groupUsers}
        precalculatedData={budgetsByUser}
      />
    </Suspense>
  );
}
