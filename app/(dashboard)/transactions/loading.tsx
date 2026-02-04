/**
 * Transactions Page Loading State
 * Shown while transaction data is being prefetched and hydrated
 *
 * Uses centralized skeleton components from features/transactions
 * Follows consistent design system and spacing patterns
 */

import { transactionStyles } from '@/styles/system';
import { TransactionListSkeleton } from '@/features/transactions/components/transaction-skeletons';

export default function TransactionsLoading() {
  return (
    <div className={transactionStyles.page.container}>
      {/* Header Skeleton */}
      <header>
        <div className={transactionStyles.header.inner}>
          <div className={transactionStyles.skeleton.title} />
        </div>
      </header>

      {/* Main Content Loading States */}
      <main className={transactionStyles.page.main}>
        <div className={transactionStyles.page.loadingContent}>
          {/* Transaction List Skeleton */}
          <TransactionListSkeleton />
        </div>
      </main>
    </div>
  );
}
