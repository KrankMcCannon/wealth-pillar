/**
 * Transactions Page - Server Component
 *
 * Keyset list window (30 rows); load-more via server action.
 */

import { Suspense } from 'react';
import { requireGroupId, requirePageAuth } from '@/lib/auth/page-auth';
import { getTransactionsListData } from '@/server/use-cases';
import { isAdmin } from '@/lib/utils/permissions';
import {
  getSeriesByGroupUseCase,
  getSeriesByUserUseCase,
} from '@/server/use-cases/recurring/recurring.use-cases';
import type { TransactionsListQuery } from '@/server/use-cases/pages/transactions-page.use-case';
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
  const typeParam: TransactionsListQuery['type'] =
    typeRaw === 'all' || typeRaw === 'income' || typeRaw === 'expense' || typeRaw === 'transfer'
      ? typeRaw
      : undefined;
  const dateRangeRaw =
    typeof resolvedSearchParams.dateRange === 'string' ? resolvedSearchParams.dateRange : undefined;
  const dateRangeParam: TransactionsListQuery['dateRange'] =
    dateRangeRaw === 'all' ||
    dateRangeRaw === 'today' ||
    dateRangeRaw === 'week' ||
    dateRangeRaw === 'month' ||
    dateRangeRaw === 'year' ||
    dateRangeRaw === 'custom' ||
    dateRangeRaw === 'today'
      ? dateRangeRaw
      : undefined;

  const query: TransactionsListQuery = {
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
    ...(typeof resolvedSearchParams.categories === 'string'
      ? { categories: resolvedSearchParams.categories }
      : {}),
    ...(typeof resolvedSearchParams.budget === 'string'
      ? { budget: resolvedSearchParams.budget }
      : {}),
  };

  const pageDataPromise = getTransactionsListData(groupId, query, currentUser).catch((err) => {
    const message = err instanceof Error ? err.message : 'Errore nel caricamento delle transazioni';
    throw new Error(message, { cause: err });
  });

  const recurringSeriesPromise = (
    isAdmin(currentUser) ? getSeriesByGroupUseCase(groupId) : getSeriesByUserUseCase(currentUser.id)
  ).catch((err) => {
    const message =
      err instanceof Error ? err.message : 'Errore nel caricamento delle serie ricorrenti';
    throw new Error(message, { cause: err });
  });

  return (
    <Suspense fallback={<TransactionPageLoading />}>
      <TransactionsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        pageDataPromise={pageDataPromise}
        recurringSeriesPromise={recurringSeriesPromise}
      />
    </Suspense>
  );
}
