'use client';

/**
 * Investments Page
 * Simple client component wrapper for loading skeleton and content
 *
 * All data fetching happens client-side with parallel execution
 * Loading skeleton displayed immediately for fast perceived performance
 */

import { Suspense } from 'react';
import InvestmentsContent from './investments-content';
import { PageLoader } from '@/src/components/shared';

export default function InvestmentsPage() {
  return (
    <Suspense fallback={<PageLoader message="Caricamento investimenti..." />}>
      <InvestmentsContent />
    </Suspense>
  );
}
