/**
 * Reports Page Loading State
 * Shown while report data is being prefetched and hydrated
 *
 * Uses centralized shared components
 * Follows consistent design system and spacing patterns
 */

import { PageLoader } from '@/components/shared';

export default function ReportsLoading() {
  return <PageLoader message="Caricamento report..." />;
}
