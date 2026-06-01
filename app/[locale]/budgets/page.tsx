/**
 * Budgets Page - Server Component
 *
 * Auth resolves immediately; page data streams inside Suspense (same pattern as transactions).
 */

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { requireGroupId, requirePageAuth } from '@/lib/auth/page-auth';
import { getBudgetsPageData } from '@/server/use-cases';
import BudgetsContent from './budgets-content';
import BudgetsLoading from './loading';

export default async function BudgetsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);
  const groupId = await requireGroupId(currentUser);

  const pageDataPromise = getBudgetsPageData(groupId, currentUser).catch(async (err) => {
    const t = await getTranslations('Errors');
    throw new Error(t('loadFailedBudgets'), { cause: err });
  });

  return (
    <Suspense fallback={<BudgetsLoading />}>
      <BudgetsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        pageDataPromise={pageDataPromise}
      />
    </Suspense>
  );
}
