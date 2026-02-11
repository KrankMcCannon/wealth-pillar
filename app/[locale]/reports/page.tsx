import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import { ReportsService } from '@/server/services/reports.service';
import { PageLoader } from '@/components/shared';
import ReportsContent from './reports-content';

export default async function ReportsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect(`/${locale}/sign-in`);
  const t = await getTranslations('ReportsPage');

  // Fetch group users first (needed for secure data fetching)
  const groupUsers = await getGroupUsers();
  const groupUserIds = groupUsers.map((u) => u.id);

  // Execute in parallel, passing group user IDs for security filtering
  const [reportsData, spendingTrends] = await Promise.all([
    ReportsService.getReportsData(groupUserIds),
    ReportsService.getSpendingTrends(
      currentUser.id,
      new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1),
      new Date()
    ),
  ]);

  const { transactions, accounts, periods, categories } = reportsData;

  // Compute Metrics on Server
  const accountTypeSummary = ReportsService.calculateAccountTypeSummary(transactions, accounts);
  const periodSummaries = ReportsService.calculatePeriodSummaries(periods, transactions, accounts);

  // Serialize transactions with fields needed for client-side filtering
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

  // Serialize accounts for client-side flow computation
  const serializableAccounts = accounts.map((a) => ({
    id: a.id,
    type: a.type,
    balance: a.balance || 0,
    user_ids: a.user_ids,
  }));

  return (
    <Suspense fallback={<PageLoader message={t('loading')} />}>
      <ReportsContent
        accountTypeSummary={accountTypeSummary}
        periodSummaries={periodSummaries}
        spendingTrends={spendingTrends}
        currentUser={currentUser}
        groupUsers={groupUsers}
        transactions={serializableTransactions}
        categories={serializableCategories}
        accounts={serializableAccounts}
      />
    </Suspense>
  );
}
