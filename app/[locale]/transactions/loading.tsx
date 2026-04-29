/**
 * Transactions Page Loading State
 */

import { PageContainer } from '@/components/layout';
import { TransactionListSkeleton } from '@/features/transactions/components/transaction-skeletons';

export default function TransactionsLoading() {
  return (
    <PageContainer>
      <div className="px-3 pb-28 pt-2" aria-busy="true" aria-label="Caricamento transazioni">
        <TransactionListSkeleton />
      </div>
    </PageContainer>
  );
}
