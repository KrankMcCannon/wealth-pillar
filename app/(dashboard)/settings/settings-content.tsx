'use client';

/**
 * Settings Content - Client Component
 *
 * Handles interactive settings UI with client-side state management
 * Data is pre-hydrated from server via HydrationBoundary
 */

import { lazy, Suspense } from 'react';
import { PageLoader } from '@/src/components/shared';

// Lazy load Settings page component
const SettingsPageComponent = lazy(() =>
  import('@/src/components/pages/settings-page').then(mod => ({
    default: mod.SettingsPage
  }))
);

/**
 * Settings Content Component
 * Wraps the lazy-loaded SettingsPage component
 */
export default function SettingsContent() {
  return (
    <Suspense fallback={<PageLoader message="Caricamento impostazioni..." />}>
      <SettingsPageComponent />
    </Suspense>
  );
}
