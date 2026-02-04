/**
 * Settings Page Loading State
 * Shown while settings data is being prefetched and hydrated
 *
 * Uses centralized skeleton components from features/settings
 * Follows consistent design system and spacing patterns
 */

import { PageLoader } from '@/components/shared';

export default function SettingsLoading() {
  return <PageLoader message="Caricamento impostazioni..." />;
}
