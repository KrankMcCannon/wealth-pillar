/**
 * Budgets Page - Server Component
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { PageDataService } from '@/server/services';
import BudgetsContent from './budgets-content';
import { BudgetSelectorSkeleton } from '@/features/budgets/components';

export default async function BudgetsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch all budget page data in parallel (optimized with Promise.all)
  const pageData = await PageDataService.getBudgetsPageData(currentUser.group_id || '');

  const {
    budgets = [],
    transactions = [],
    accounts = [],
    categories = [],
    budgetPeriods = {},
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
      />
    </Suspense>
  );
}
