/**
 * Settings Page Loading State
 * Skeleton that mirrors settings layout (header, list sections)
 * to reduce layout shift and align with other loading states.
 */

import { BottomNavigation, PageContainer } from '@/components/layout';
import { SkeletonBox } from '@/components/ui/primitives/skeleton-box';
import { SkeletonList } from '@/components/ui/primitives/skeleton-list';
import { settingsStyles } from '@/features/settings/theme';

export default function SettingsLoading() {
  return (
    <PageContainer className={settingsStyles.page.container}>
      <div className={settingsStyles.main.container}>
        <div className="flex items-center gap-3 mb-1">
          <SkeletonBox height="h-10" width="w-10" variant="light" className="rounded-xl shrink-0" />
          <SkeletonBox height="h-8" width="w-48" variant="medium" />
        </div>
        <SkeletonList count={6} height="h-14" spacing="space-y-2" variant="light" />
      </div>
      <BottomNavigation />
    </PageContainer>
  );
}
