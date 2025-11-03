'use client';

/**
 * Reports Content - Client Component
 *
 * Handles interactive reports UI with client-side state management
 * Data is pre-hydrated from server via HydrationBoundary
 */

import { lazy, Suspense } from 'react';
import { PageLoader } from '@/src/components/shared';

// Lazy load Reports page component
const ReportsPageComponent = lazy(() =>
  import('@/src/components/pages/reports-page').then(mod => ({
    default: mod.ReportsPage
  }))
);

/**
 * Reports Content Component
 * Wraps the lazy-loaded ReportsPage component
 */
export default function ReportsContent() {
  return (
    <Suspense fallback={<PageLoader message="Caricamento report..." />}>
      <ReportsPageComponent />
    </Suspense>
  );
}
