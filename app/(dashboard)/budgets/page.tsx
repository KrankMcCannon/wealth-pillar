/**
 * Budgets Page - Server Component
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { PageDataService } from '@/lib/services';
import BudgetsContent from './budgets-content';
import { BudgetSelectorSkeleton } from '@/features/budgets/components';

export default async function BudgetsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch all budget page data in parallel (optimized with Promise.all)
  const { data, error } = await PageDataService.getBudgetsPageData(currentUser.group_id);

  if (error) {
    console.error('Failed to fetch budgets page data:', error);
  }

  const { budgets = [], transactions = [], accounts = [], categories = [] } = data || {};

  return (
    <Suspense fallback={<BudgetSelectorSkeleton />}>
      <BudgetsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        categories={categories || []}
        budgets={budgets || []}
        transactions={transactions || []}
        accounts={accounts || []}
      />
    </Suspense>
  );
}
