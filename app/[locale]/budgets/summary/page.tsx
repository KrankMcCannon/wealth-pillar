/**
 * Budget Summary Page - Server Component
 */

import { Suspense } from 'react';
import { requirePageAuth } from '@/lib/auth/page-auth';
import { PageDataService } from '@/server/services';
import BudgetSummaryContent from './budget-summary-content';
import { BudgetSelectorSkeleton } from '@/features/budgets/components';

export default async function BudgetSummaryPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);

  const pageDataPromise = PageDataService.getBudgetsPageData(currentUser.group_id || '').catch(
    (err) => {
      const message = err instanceof Error ? err.message : 'Errore nel caricamento del riepilogo';
      throw new Error(message, { cause: err });
    }
  );

  return (
    <Suspense fallback={<BudgetSelectorSkeleton />}>
      <BudgetSummaryContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        pageDataPromise={pageDataPromise}
      />
    </Suspense>
  );
}
