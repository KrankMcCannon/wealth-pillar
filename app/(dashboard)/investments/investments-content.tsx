'use client';

/**
 * Investments Content - Client Component
 *
 * Handles interactive investments UI with client-side state management
 * Data is pre-hydrated from server via HydrationBoundary
 */

import { lazy, Suspense } from 'react';
import { PageLoader } from '@/src/components/shared';

// Lazy load Investments page component
const InvestmentsPageComponent = lazy(() =>
  import('@/src/components/pages/investments-page').then(mod => ({
    default: mod.InvestmentsPage
  }))
);

/**
 * Investments Content Component
 * Wraps the lazy-loaded InvestmentsPage component
 */
export default function InvestmentsContent() {
  return (
    <Suspense fallback={<PageLoader message="Caricamento investimenti..." />}>
      <InvestmentsPageComponent />
    </Suspense>
  );
}
