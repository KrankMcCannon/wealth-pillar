/**
 * Reports Page Loading State
 * Shown while report data is being prefetched and hydrated
 *
 * Uses centralized shared components
 * Follows consistent design system and spacing patterns
 */

import { PageLoader } from '@/components/shared';
import { getTranslations } from 'next-intl/server';

export default async function ReportsLoading() {
  const t = await getTranslations('ReportsPage');
  return <PageLoader message={t('loading')} />;
}
