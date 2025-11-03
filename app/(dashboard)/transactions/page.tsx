'use client';

/**
 * Transactions Page
 * Simple client component wrapper for loading skeleton and content
 *
 * All data fetching happens client-side with parallel execution
 * Loading skeleton displayed immediately for fast perceived performance
 */

import { Suspense } from 'react';
import TransactionsContent from './transactions-content';
import TransactionPageLoading from './loading';

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionPageLoading />}>
      <TransactionsContent />
    </Suspense>
  );
}
