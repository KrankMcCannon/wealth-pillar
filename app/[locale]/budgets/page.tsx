/**
 * Budgets Page - Server Component
 */

import { Suspense } from 'react';
import { requirePageAuth } from '@/lib/auth/page-auth';
import { PageDataService } from '@/server/services';
import BudgetsContent from './budgets-content';
import { BudgetSelectorSkeleton } from '@/features/budgets/components';

export default async function BudgetsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);

  const pageDataPromise = PageDataService.getBudgetsPageData(currentUser.group_id || '').catch(
    (err) => {
      const message = err instanceof Error ? err.message : 'Errore nel caricamento dei budget';
      throw new Error(message, { cause: err });
    }
  );

  return (
    <Suspense fallback={<BudgetSelectorSkeleton />}>
      <BudgetsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        pageDataPromise={pageDataPromise}
      />
    </Suspense>
  );
}
