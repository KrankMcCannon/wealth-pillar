/**
 * Transactions Page - Server Component
 *
 * Uses paginated data fetching (50 transactions per load)
 */

import { Suspense } from 'react';
import { requireGroupId, requirePageAuth } from '@/lib/auth/page-auth';
import { getTransactionsPageData } from '@/server/use-cases';
import type { TransactionsPageQuery } from '@/server/use-cases/pages/transactions-page.use-case';
import TransactionsContent from './transactions-content';
import TransactionPageLoading from './loading';

export default async function TransactionsPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);
  const groupId = await requireGroupId(currentUser);
  const resolvedSearchParams = await searchParams;
  const typeRaw =
    typeof resolvedSearchParams.type === 'string' ? resolvedSearchParams.type : undefined;
  const typeParam: TransactionsPageQuery['type'] =
    typeRaw === 'all' || typeRaw === 'income' || typeRaw === 'expense' || typeRaw === 'transfer'
      ? typeRaw
      : undefined;
  const dateRangeRaw =
    typeof resolvedSearchParams.dateRange === 'string' ? resolvedSearchParams.dateRange : undefined;
  const dateRangeParam: TransactionsPageQuery['dateRange'] =
    dateRangeRaw === 'all' ||
    dateRangeRaw === 'today' ||
    dateRangeRaw === 'week' ||
    dateRangeRaw === 'month' ||
    dateRangeRaw === 'year' ||
    dateRangeRaw === 'custom'
      ? dateRangeRaw
      : undefined;

  const query: TransactionsPageQuery = {
    ...(typeof resolvedSearchParams.user === 'string' ? { user: resolvedSearchParams.user } : {}),
    ...(typeof resolvedSearchParams.q === 'string' ? { q: resolvedSearchParams.q } : {}),
    ...(typeParam ? { type: typeParam } : {}),
    ...(dateRangeParam ? { dateRange: dateRangeParam } : {}),
    ...(typeof resolvedSearchParams.startDate === 'string'
      ? { startDate: resolvedSearchParams.startDate }
      : {}),
    ...(typeof resolvedSearchParams.endDate === 'string'
      ? { endDate: resolvedSearchParams.endDate }
      : {}),
    ...(typeof resolvedSearchParams.account === 'string'
      ? { account: resolvedSearchParams.account }
      : {}),
    ...(typeof resolvedSearchParams.category === 'string'
      ? { category: resolvedSearchParams.category }
      : {}),
    ...(typeof resolvedSearchParams.page === 'string' ? { page: resolvedSearchParams.page } : {}),
    ...(typeof resolvedSearchParams.pageSize === 'string'
      ? { pageSize: resolvedSearchParams.pageSize }
      : {}),
    ...(typeof resolvedSearchParams.cursor === 'string'
      ? { cursor: resolvedSearchParams.cursor }
      : {}),
  };

  const pageDataPromise = getTransactionsPageData(groupId, query, currentUser).catch((err) => {
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
