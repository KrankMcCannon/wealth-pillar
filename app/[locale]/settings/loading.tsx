/**
 * Settings Page Loading State
 * Shown while settings data is being prefetched and hydrated
 *
 * Uses centralized skeleton components from features/settings
 * Follows consistent design system and spacing patterns
 */

import { PageLoader } from '@/components/shared';
import { getTranslations } from 'next-intl/server';

export default async function SettingsLoading() {
  const t = await getTranslations('SettingsPage');
  return <PageLoader message={t('loading')} />;
}
