/**
 * Settings Page Loading State
 * Skeleton that mirrors settings layout (header, list sections)
 * to reduce layout shift and align with other loading states.
 */

import { BottomNavigation, PageContainer } from '@/components/layout';
import { SkeletonBox } from '@/components/ui/primitives/skeleton-box';
import { SkeletonList } from '@/components/ui/primitives/skeleton-list';

export default function SettingsLoading() {
  return (
    <PageContainer>
      <div className="px-3 sm:px-4 py-4 pb-24 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <SkeletonBox height="h-10" width="w-10" variant="light" className="rounded-xl shrink-0" />
          <SkeletonBox height="h-8" width="w-48" variant="medium" />
        </div>
        <SkeletonList count={6} height="h-14" spacing="space-y-2" variant="light" />
      </div>
      <BottomNavigation />
    </PageContainer>
  );
}
