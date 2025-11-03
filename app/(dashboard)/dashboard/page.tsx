'use client';

/**
 * Dashboard Page
 * Simple client component wrapper for loading skeleton and content
 *
 * All data fetching happens client-side with parallel execution
 * Loading skeleton displayed immediately for fast perceived performance
 */

import { Suspense } from 'react';
import DashboardContent from './dashboard-content';
import DashboardPageLoading from './loading';

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardPageLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
