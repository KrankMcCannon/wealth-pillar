'use client';

/**
 * Settings Page
 * Simple client component wrapper for loading skeleton and content
 *
 * All data fetching happens client-side with parallel execution
 * Loading skeleton displayed immediately for fast perceived performance
 */

import { Suspense } from 'react';
import SettingsContent from './settings-content';
import { PageLoader } from '@/src/components/shared';

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageLoader message="Caricamento impostazioni..." />}>
      <SettingsContent />
    </Suspense>
  );
}
