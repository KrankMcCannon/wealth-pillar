/**
 * Investments Page Loading State
 * Shown while investment data is being prefetched and hydrated
 *
 * Uses centralized shared components
 * Follows consistent design system and spacing patterns
 */

import { PageLoader } from '@/components/shared';
import { getTranslations } from 'next-intl/server';

export default async function InvestmentsLoading() {
  const t = await getTranslations('InvestmentsPage');
  return <PageLoader message={t('loading')} />;
}
