/**
 * Transactions Page - Server Component
 *
 * Uses paginated data fetching (50 transactions per load)
 */

import { Suspense } from 'react';
import { requirePageAuth } from '@/lib/auth/page-auth';
import { getTransactionsPageData } from '@/server/use-cases';
import TransactionsContent from './transactions-content';
import TransactionPageLoading from './loading';

export default async function TransactionsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);

  const pageDataPromise = getTransactionsPageData(currentUser.group_id || '').catch((err) => {
    const message = err instanceof Error ? err.message : 'Errore nel caricamento delle transazioni';
    throw new Error(message, { cause: err });
  });

  return (
    <Suspense fallback={<TransactionPageLoading />}>
      <TransactionsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        pageDataPromise={pageDataPromise}
      />
    </Suspense>
  );
}
