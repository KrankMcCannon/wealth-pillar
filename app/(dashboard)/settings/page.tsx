import { lazy, Suspense } from 'react';
import { PageLoader } from '@/src/components/shared';

// Lazy load Settings page component to reduce initial bundle
const SettingsPageComponent = lazy(() =>
  import('@/src/components/pages/settings-page').then(mod => ({
    default: mod.SettingsPage
  }))
);

/**
 * Settings Page - Lazy loaded for performance optimization
 * This splits the Settings feature from the initial page bundle
 * Reduces initial JS by ~50KB (Settings is a large page)
 */
export default function SettingsPage() {
  return (
    <Suspense fallback={<PageLoader message="Caricamento impostazioni..." />}>
      <SettingsPageComponent />
    </Suspense>
  );
}
