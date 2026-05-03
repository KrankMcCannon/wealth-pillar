/**
 * Reports page loading — skeleton allineato al layout Stitch dark mobile-only.
 */

import { BottomNavigation, PageContainer } from '@/components/layout';
import { SkeletonBox } from '@/components/ui/primitives/skeleton-box';
import { stitchReports } from '@/styles/home-design-foundation';

export default function ReportsLoading() {
  return (
    <PageContainer>
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#3359c5]/25 bg-[#0c1738]/88 px-4 py-2.5 backdrop-blur-xl">
        <SkeletonBox height="h-9" width="w-9" variant="light" className="rounded-full" />
        <SkeletonBox height="h-5" width="w-24" variant="medium" />
        <SkeletonBox height="h-9" width="w-9" variant="light" className="rounded-full" />
      </div>

      <div className="sticky z-30 border-b border-[#3359c5]/25 bg-[#050818]/90 px-4 py-2 backdrop-blur-sm">
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox
              key={i}
              height="h-9"
              width="w-24"
              variant="light"
              className="rounded-full shrink-0"
            />
          ))}
        </div>
      </div>

      <main className="flex flex-col gap-5 px-4 pb-[max(7rem,calc(5.5rem+env(safe-area-inset-bottom)))] pt-4">
        <div className={stitchReports.heroNetCard}>
          <SkeletonBox height="h-3" width="w-20" variant="light" className="mb-2" />
          <SkeletonBox height="h-9" width="w-40" variant="medium" className="mb-3" />
          <SkeletonBox height="h-4" width="w-32" variant="light" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SkeletonBox height="h-20" variant="light" className="rounded-xl" />
          <SkeletonBox height="h-20" variant="light" className="rounded-xl" />
        </div>

        <div>
          <SkeletonBox height="h-6" width="w-36" variant="medium" className="mb-3" />
          <div className={stitchReports.rankingCard}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-[#3359c5]/20 py-3 last:border-0">
                <div className="mb-2 flex justify-between gap-2">
                  <SkeletonBox height="h-4" width="w-28" variant="light" />
                  <SkeletonBox height="h-4" width="w-16" variant="light" />
                </div>
                <SkeletonBox
                  height="h-1.5"
                  width="w-full"
                  variant="light"
                  className="rounded-full"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <SkeletonBox height="h-6" width="w-44" variant="medium" className="mb-3" />
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <SkeletonBox key={i} height="h-[72px]" variant="light" className="rounded-xl" />
            ))}
          </div>
        </div>

        <div>
          <SkeletonBox height="h-6" width="w-40" variant="medium" className="mb-3" />
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <SkeletonBox key={i} height="h-28" variant="light" className="rounded-xl" />
            ))}
          </div>
        </div>

        <div className="border-t border-[#3359c5]/25 pt-4">
          <SkeletonBox height="h-6" width="w-36" variant="medium" className="mb-2" />
          <SkeletonBox height="h-10" width="w-full" variant="light" className="rounded-lg" />
        </div>
      </main>

      <BottomNavigation />
    </PageContainer>
  );
}
