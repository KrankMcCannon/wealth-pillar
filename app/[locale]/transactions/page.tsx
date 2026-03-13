/**
 * Transactions Page - Server Component
 *
 * Uses paginated data fetching (50 transactions per load)
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import { PageDataService } from '@/server/services';
import TransactionsContent from './transactions-content';
import TransactionPageLoading from './loading';

export default async function TransactionsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect(`/${locale}/sign-in`);
  const groupUsers = await getGroupUsers();

  let pageData: Awaited<ReturnType<typeof PageDataService.getTransactionsPageData>>;
  try {
    pageData = await PageDataService.getTransactionsPageData(currentUser.group_id || '');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore nel caricamento delle transazioni';
    throw new Error(message, { cause: err });
  }

  const {
    transactions = [],
    total = 0,
    hasMore = false,
    recurringSeries = [],
    budgets = [],
    accounts = [],
    categories = [],
  } = pageData;

  return (
    <Suspense fallback={<TransactionPageLoading />}>
      <TransactionsContent
        transactions={transactions}
        totalTransactions={total}
        hasMoreTransactions={hasMore}
        recurringSeries={recurringSeries}
        budgets={budgets}
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        categories={categories}
      />
    </Suspense>
  );
}
