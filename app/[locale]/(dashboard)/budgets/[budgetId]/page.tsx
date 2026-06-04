/**
 * Budget Detail Page - Server Component
 */

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { resolvePageContext } from '@/lib/auth/page-auth';
import { getBudgetDetailPageData } from '@/server/use-cases';
import BudgetDetailContent from './budget-detail-content';
import BudgetDetailLoading from './loading';

async function BudgetDetailPageData({
  params,
}: Readonly<{ params: Promise<{ locale: string; budgetId: string }> }>) {
  const { currentUser, groupId } = await resolvePageContext(params);
  const { budgetId } = await params;

  const pageDataPromise = getBudgetDetailPageData(groupId, budgetId, currentUser).catch(
    async (err) => {
      if (err instanceof Error && err.message === 'NOT_FOUND') {
        throw err;
      }
      const t = await getTranslations('Errors');
      throw new Error(t('loadFailedBudgets'), { cause: err });
    }
  );

  return <BudgetDetailContent currentUser={currentUser} pageDataPromise={pageDataPromise} />;
}

export default function BudgetDetailPage({
  params,
}: Readonly<{ params: Promise<{ locale: string; budgetId: string }> }>) {
  return (
    <Suspense fallback={<BudgetDetailLoading />}>
      <BudgetDetailPageData params={params} />
    </Suspense>
  );
}
