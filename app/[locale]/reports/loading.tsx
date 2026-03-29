/**
 * Reports Page Loading State
 * Skeleton allineato al layout: panoramica gruppo (riepilogo unico + grafici) e dettaglio membro
 */

import { BottomNavigation, PageContainer } from '@/components/layout';
import { SkeletonBox } from '@/components/ui/primitives/skeleton-box';

export default function ReportsLoading() {
  return (
    <PageContainer>
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-primary/20 px-3 sm:px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <SkeletonBox height="h-8" width="w-8" variant="light" className="rounded-xl" />
          <SkeletonBox height="h-6" width="w-32" variant="medium" />
        </div>
      </div>

      <div className="px-3 sm:px-4 py-4 pb-20 space-y-6 sm:space-y-8">
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonBox
              key={i}
              height="h-7"
              width="w-20"
              variant="light"
              className="rounded-full"
            />
          ))}
        </div>

        {/* Sezione gruppo: titolo + riepilogo hero + strip */}
        <div className="space-y-4">
          <div className="space-y-2">
            <SkeletonBox height="h-6" width="w-48" variant="medium" />
            <SkeletonBox height="h-4" width="w-full max-w-md" variant="light" />
          </div>
          <div className="rounded-2xl border border-primary/15 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-primary/10 space-y-2">
              <SkeletonBox height="h-3" width="w-24" variant="light" />
              <SkeletonBox height="h-10" width="w-44" variant="medium" />
              <SkeletonBox height="h-3" width="w-56" variant="light" />
            </div>
            <div className="grid grid-cols-3 divide-x divide-primary/10">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 space-y-2">
                  <SkeletonBox height="h-3" width="w-16" variant="light" />
                  <SkeletonBox height="h-5" width="w-20" variant="medium" />
                  <SkeletonBox height="h-3" width="w-full" variant="light" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <SkeletonBox height="h-6" width="w-56" variant="medium" />
              <SkeletonBox height="h-4" width="w-full max-w-lg" variant="light" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="col-span-1 md:col-span-8 min-w-0">
                <SkeletonBox height="h-[300px]" variant="light" className="rounded-xl" />
              </div>
              <div className="col-span-1 md:col-span-4 min-w-0">
                <SkeletonBox height="h-[300px]" variant="light" className="rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Sezione membro: titolo + selettore + riepilogo compatto + flusso + periodi */}
        <div className="space-y-4 border-t border-primary/10 pt-5 sm:pt-7">
          <div className="space-y-2">
            <SkeletonBox height="h-6" width="w-40" variant="medium" />
            <SkeletonBox height="h-4" width="w-full max-w-md" variant="light" />
          </div>
          <SkeletonBox
            height="h-11"
            width="w-full max-w-sm"
            variant="light"
            className="rounded-xl"
          />
          <div className="rounded-xl border border-primary/10 overflow-hidden md:flex md:flex-row md:items-stretch">
            <div className="p-4 sm:p-5 border-b md:border-b-0 md:border-r border-primary/10 md:basis-[min(42%,15.5rem)] md:shrink-0 space-y-2">
              <SkeletonBox height="h-3" width="w-24" variant="light" />
              <SkeletonBox height="h-8" width="w-36" variant="medium" />
              <SkeletonBox height="h-3" width="w-44" variant="light" />
            </div>
            <div className="grid grid-cols-3 divide-x divide-primary/10 md:flex-1 min-w-0">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 sm:p-4 space-y-2">
                  <SkeletonBox height="h-3" width="w-12" variant="light" />
                  <SkeletonBox height="h-4" width="w-16" variant="medium" />
                  <SkeletonBox height="h-3" width="w-full" variant="light" />
                </div>
              ))}
            </div>
          </div>
          <SkeletonBox height="h-[280px]" variant="light" className="rounded-xl" />
          <div className="space-y-3 pt-2">
            <SkeletonBox height="h-6" width="w-36" variant="medium" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <SkeletonBox key={i} height="h-48" variant="light" className="rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </PageContainer>
  );
}
