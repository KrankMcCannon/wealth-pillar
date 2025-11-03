'use client';

/**
 * Budgets Page
 * Simple client component wrapper for loading skeleton and content
 *
 * All data fetching happens client-side with parallel execution
 * Loading skeleton displayed immediately for fast perceived performance
 */

import { Suspense } from 'react';
import BudgetsContent from './budgets-content';
import { BudgetSelectorSkeleton } from '@/features/budgets/components';

export default function BudgetsPage() {
  return (
    <Suspense fallback={<BudgetSelectorSkeleton />}>
      <BudgetsContent />
    </Suspense>
  );
}
