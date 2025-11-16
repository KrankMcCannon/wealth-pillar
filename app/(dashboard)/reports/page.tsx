/**
 * Reports Page - Server Component
 * Uses shared utility for consistent data fetching across all dashboard pages
 * Business logic is handled by TransactionService following SOLID principles
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { TransactionService } from '@/lib/services';
import ReportsContent from './reports-content';
import { PageLoader } from '@/src/components/shared';

export default async function ReportsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch all group transactions using service layer
  const { data: transactions } = await TransactionService.getTransactionsByGroup(
    currentUser.group_id
  );

  // Calculate metrics using business logic in service layer
  const metrics = TransactionService.calculateReportMetrics(transactions || []);

  return (
    <Suspense fallback={<PageLoader message="Caricamento report..." />}>
      <ReportsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        transactions={transactions || []}
        initialMetrics={metrics}
      />
    </Suspense>
  );
}
