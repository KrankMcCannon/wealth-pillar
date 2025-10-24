import { lazy, Suspense } from 'react';
import { PageLoader } from '@/src/components/shared';

// Lazy load Investments page component to reduce initial bundle
const InvestmentsPageComponent = lazy(() =>
  import('@/src/components/pages/investments-page').then(mod => ({
    default: mod.InvestmentsPage
  }))
);

/**
 * Investments Page - Lazy loaded for performance optimization
 * This splits the Investments feature from the initial page bundle
 * Reduces initial JS by ~25KB
 */
export default function InvestmentsPage() {
  return (
    <Suspense fallback={<PageLoader message="Caricamento investimenti..." />}>
      <InvestmentsPageComponent />
    </Suspense>
  );
}
