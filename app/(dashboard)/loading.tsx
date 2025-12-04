/**
 * Dashboard Group Loading State
 * Shown while dashboard layout and pages are loading
 */

import { SkeletonBox, SkeletonList } from "@/components/ui/primitives";

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 max-w-md w-full px-4">
        {/* Header Skeleton */}
        <SkeletonBox height="h-10" variant="light" />

        {/* Content Skeletons */}
        <SkeletonList count={3} height="h-24" spacing="space-y-3" variant="medium" />
      </div>
    </div>
  );
}
