import { Suspense } from 'react';
import { requirePageAuth } from '@/lib/auth/page-auth';
import { ReportsService } from '@/server/services';
import ReportsLoading from './loading';
import ReportsContent from './reports-content';

export default async function ReportsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);

  const groupUserIds = groupUsers.map((u) => u.id);
  const groupId = currentUser.group_id;
  if (!groupId) {
    throw new Error('Reports require a group');
  }

  const reportsBundlePromise = (async () => {
    const reportsData = await ReportsService.getReportsData(groupId, groupUserIds);
    const { transactions, accounts, periods, categories } = reportsData;

    const trendRangeStart = new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1);
    const trendRangeEnd = new Date();
    const spendingTrends = ReportsService.calculateTimeTrends(transactions, {
      start: trendRangeStart,
      end: trendRangeEnd,
    });

    const accountTypeSummary = ReportsService.calculateAccountTypeSummary(transactions, accounts);
    const periodSummaries = ReportsService.calculatePeriodSummaries(
      periods,
      transactions,
      accounts
    );

    const serializableTransactions = transactions.map((t) => ({
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: typeof t.date === 'string' ? t.date : new Date(t.date).toISOString(),
      user_id: t.user_id,
      account_id: t.account_id,
      to_account_id: t.to_account_id || null,
    }));

    const serializableCategories = categories.map((c) => ({
      id: c.id,
      label: c.label,
      key: c.key,
      color: c.color,
    }));

    const serializableAccounts = accounts.map((a) => ({
      id: a.id,
      type: a.type,
      balance: a.balance || 0,
      user_ids: a.user_ids,
    }));

    return {
      accountTypeSummary,
      periodSummaries,
      spendingTrends,
      transactions: serializableTransactions,
      categories: serializableCategories,
      accounts: serializableAccounts,
    };
  })().catch((err) => {
    const message = err instanceof Error ? err.message : 'Errore nel caricamento dei report';
    throw new Error(message, { cause: err });
  });

  return (
    <Suspense fallback={<ReportsLoading />}>
      <ReportsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        reportsBundlePromise={reportsBundlePromise}
      />
    </Suspense>
  );
}
