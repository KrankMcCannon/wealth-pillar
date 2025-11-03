'use client';

/**
 * Reports Page
 * Simple client component wrapper for loading skeleton and content
 *
 * All data fetching happens client-side with parallel execution
 * Loading skeleton displayed immediately for fast perceived performance
 */

import { Suspense } from 'react';
import ReportsContent from './reports-content';
import { PageLoader } from '@/src/components/shared';

export default function ReportsPage() {
  return (
    <Suspense fallback={<PageLoader message="Caricamento report..." />}>
      <ReportsContent />
    </Suspense>
  );
}
