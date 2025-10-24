import { lazy, Suspense } from 'react';
import { PageLoader } from '@/src/components/shared';

// Lazy load Reports page component to reduce initial bundle
const ReportsPageComponent = lazy(() =>
  import('@/src/components/pages/reports-page').then(mod => ({
    default: mod.ReportsPage
  }))
);

/**
 * Reports Page - Lazy loaded for performance optimization
 * This splits the Reports feature from the initial page bundle
 * Reduces initial JS by ~30KB
 */
export default function ReportsPage() {
  return (
    <Suspense fallback={<PageLoader message="Caricamento report..." />}>
      <ReportsPageComponent />
    </Suspense>
  );
}
