/**
 * Investments Page - Server Component
 */

import { Suspense } from 'react';
import InvestmentsContent from './investments-content';
import { PageLoader } from '@/src/components/shared';

export default async function InvestmentsPage() {
  return (
    <Suspense fallback={<PageLoader message="Caricamento investimenti..." />}>
      <InvestmentsContent />
    </Suspense>
  );
}
