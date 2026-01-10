/**
 * Dashboard Group Loading State
 * Shown while dashboard layout and pages are loading
 */

import { SkeletonBox, SkeletonList } from "@/components/ui/primitives";
import { dashboardStyles } from "@/features/dashboard/theme/dashboard-styles";

export default function DashboardLoading() {
  return (
    <div className={dashboardStyles.groupLoading.container}>
      <div className={dashboardStyles.groupLoading.card}>
        {/* Header Skeleton */}
        <SkeletonBox height="h-10" variant="light" />

        {/* Content Skeletons */}
        <SkeletonList count={3} height="h-24" spacing="space-y-3" variant="medium" />
      </div>
    </div>
  );
}
