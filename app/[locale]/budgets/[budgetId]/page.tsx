/**
 * Budget Detail Page - Server Component
 */

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { requireGroupId, requirePageAuth } from '@/lib/auth/page-auth';
import { getBudgetDetailPageData } from '@/server/use-cases';
import BudgetDetailContent from './budget-detail-content';
import BudgetDetailLoading from './loading';

export default async function BudgetDetailPage({
  params,
}: Readonly<{ params: Promise<{ locale: string; budgetId: string }> }>) {
  const { currentUser } = await requirePageAuth(params);
  const { budgetId } = await params;
  const groupId = await requireGroupId(currentUser);

  const pageDataPromise = getBudgetDetailPageData(groupId, budgetId).catch(async (err) => {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      throw err;
    }
    const t = await getTranslations('Errors');
    throw new Error(t('loadFailedBudgets'), { cause: err });
  });

  return (
    <Suspense fallback={<BudgetDetailLoading />}>
      <BudgetDetailContent currentUser={currentUser} pageDataPromise={pageDataPromise} />
    </Suspense>
  );
}
