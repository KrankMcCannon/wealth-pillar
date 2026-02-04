import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import { ReportsService } from '@/server/services/reports.service';
import { PageLoader } from '@/components/shared';
import ReportsContent from './reports-content';

export default async function ReportsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/auth');

  // Execute in parallel
  const [groupUsers, reportsData] = await Promise.all([
    getGroupUsers(),
    ReportsService.getReportsData(),
  ]);

  const { transactions, accounts, periods, categories } = reportsData;

  // Compute Metrics on Server
  const accountTypeSummary = ReportsService.calculateAccountTypeSummary(transactions, accounts);
  const periodSummaries = ReportsService.calculatePeriodSummaries(periods, transactions, accounts);
  const { income: incomeStats, expense: expenseStats } = ReportsService.calculateCategoryStats(
    transactions,
    categories
  );

  return (
    <Suspense fallback={<PageLoader message="Caricamento rapporti..." />}>
      <ReportsContent
        accountTypeSummary={accountTypeSummary}
        periodSummaries={periodSummaries}
        incomeStats={incomeStats}
        expenseStats={expenseStats}
        currentUser={currentUser}
        groupUsers={groupUsers}
      />
    </Suspense>
  );
}
