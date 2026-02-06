/**
 * Budget Summary Page - Server Component
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import { PageDataService } from '@/server/services';
import BudgetSummaryContent from './budget-summary-content';
import { BudgetSelectorSkeleton } from '@/features/budgets/components';

export default async function BudgetSummaryPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect(`/${locale}/sign-in`);
  const groupUsers = await getGroupUsers();

  // Fetch all budget page data
  const pageData = await PageDataService.getBudgetsPageData(currentUser.group_id || '');

  const {
    budgets = [],
    transactions = [],
    accounts = [],
    categories = [],
    budgetsByUser = {},
  } = pageData;

  return (
    <Suspense fallback={<BudgetSelectorSkeleton />}>
      <BudgetSummaryContent
        categories={categories || []}
        budgets={budgets || []}
        transactions={transactions || []}
        accounts={accounts || []}
        currentUser={currentUser}
        groupUsers={groupUsers}
        precalculatedData={budgetsByUser}
      />
    </Suspense>
  );
}
