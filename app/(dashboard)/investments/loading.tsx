/**
 * Investments Page Loading State
 * Shown while investment data is being prefetched and hydrated
 *
 * Uses centralized shared components
 * Follows consistent design system and spacing patterns
 */

import { PageLoader } from '@/components/shared';

export default function InvestmentsLoading() {
  return (
    <PageLoader message="Caricamento investimenti..." />
  );
}
