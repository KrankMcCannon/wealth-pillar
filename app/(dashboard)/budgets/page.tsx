/**
 * Budgets Page - Server Component
 * Uses shared utility for consistent data fetching across all dashboard pages
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import BudgetsContent from './budgets-content';
import { BudgetSelectorSkeleton } from '@/features/budgets/components';

export default async function BudgetsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  return (
    <Suspense fallback={<BudgetSelectorSkeleton />}>
      <BudgetsContent currentUser={currentUser} groupUsers={groupUsers} />
    </Suspense>
  );
}
