/**
 * Transactions Page Loading State
 * Shown while transaction data is being prefetched and hydrated
 *
 * Uses centralized skeleton components from features/transactions
 * Follows consistent design system and spacing patterns
 */

import { transactionStyles } from '@/features/transactions/theme/transaction-styles';
import {
  SearchFilterSkeleton,
  TransactionListSkeleton,
} from '@/features/transactions/components/transaction-skeletons';

export default function TransactionsLoading() {
  return (
    <div className={transactionStyles.page.container}>
      {/* Header Skeleton */}
      <header className={transactionStyles.header.container}>
        <div className={transactionStyles.header.inner}>
          <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        </div>
      </header>

      {/* Main Content Loading States */}
      <main className={transactionStyles.page.main}>
        <div className="space-y-6">
          {/* Search and Filter Skeleton */}
          <SearchFilterSkeleton />

          {/* Transaction List Skeleton */}
          <TransactionListSkeleton />
        </div>
      </main>
    </div>
  );
}
