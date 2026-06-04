/**
 * Budgets Page - Server Component
 *
 * Auth and page data resolve inside Suspense.
 */

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { resolvePageContext } from '@/lib/auth/page-auth';
import { getBudgetsPageData } from '@/server/use-cases';
import BudgetsContent from './budgets-content';
import BudgetsLoading from './loading';

async function BudgetsPageData({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers, groupId } = await resolvePageContext(params);

  const pageDataPromise = getBudgetsPageData(groupId, currentUser).catch(async (err) => {
    const t = await getTranslations('Errors');
    throw new Error(t('loadFailedBudgets'), { cause: err });
  });

  return (
    <BudgetsContent
      currentUser={currentUser}
      groupUsers={groupUsers}
      pageDataPromise={pageDataPromise}
    />
  );
}

export default function BudgetsPage({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  return (
    <Suspense fallback={<BudgetsLoading />}>
      <BudgetsPageData params={params} />
    </Suspense>
  );
}
