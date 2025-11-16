/**
 * Reports Page - Server Component
 * Uses shared utility for consistent data fetching across all dashboard pages
 * Business logic is handled by TransactionService and CategoryService following SOLID principles
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { TransactionService, CategoryService } from '@/lib/services';
import ReportsContent from './reports-content';
import { PageLoader } from '@/src/components/shared';

export default async function ReportsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch data in parallel for optimal performance
  const [transactionsResult, categoriesResult] = await Promise.all([
    TransactionService.getTransactionsByGroup(currentUser.group_id),
    CategoryService.getAllCategories(),
  ]);

  // Calculate metrics using business logic in service layer
  const metrics = TransactionService.calculateReportMetrics(
    transactionsResult.data || []
  );

  return (
    <Suspense fallback={<PageLoader message="Caricamento report..." />}>
      <ReportsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        transactions={transactionsResult.data || []}
        categories={categoriesResult.data || []}
        initialMetrics={metrics}
      />
    </Suspense>
  );
}
