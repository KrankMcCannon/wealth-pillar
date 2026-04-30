/**
 * Transactions Page Loading State
 */

import { PageContainer, dashboardContentBottomPadding } from '@/components/layout';
import { TransactionListSkeleton } from '@/features/transactions/components/transaction-skeletons';

export default function TransactionsLoading() {
  return (
    <PageContainer>
      <div
        className={`px-3 pt-2 ${dashboardContentBottomPadding}`}
        aria-busy="true"
        aria-label="Caricamento transazioni"
      >
        <TransactionListSkeleton />
      </div>
    </PageContainer>
  );
}
