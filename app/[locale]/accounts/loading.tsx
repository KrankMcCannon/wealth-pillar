/**
 * Accounts Page Loading State — skeleton dark allineato a Stitch / accounts-content.
 */

import { BottomNavigation, PageContainer } from '@/components/layout';
import { headerStyles } from '@/components/layout/theme/header-styles';
import { SkeletonBox } from '@/components/ui/primitives/skeleton-box';
import { cn } from '@/lib/utils';
import { STICKY_HEADER_BASE } from '@/lib/utils/ui-constants';
import { stitchAccounts } from '@/styles/home-design-foundation';

function AccountsHeaderSkeleton() {
  return (
    <header className={cn(STICKY_HEADER_BASE, headerStyles.container)}>
      <div className={headerStyles.inner}>
        <div className={headerStyles.slotLeft}>
          <SkeletonBox height="h-9" width="w-9" variant="light" className="rounded-full" />
        </div>
        <div className={headerStyles.slotCenter}>
          <div className="space-y-1.5 text-center">
            <SkeletonBox height="h-5" width="w-32" variant="medium" className="mx-auto" />
            <SkeletonBox height="h-3" width="w-40" variant="light" className="mx-auto" />
          </div>
        </div>
        <div className={headerStyles.slotRight}>
          <SkeletonBox height="h-9" width="w-9" variant="light" className="rounded-full" />
        </div>
      </div>
    </header>
  );
}

export default function AccountsLoading() {
  return (
    <PageContainer>
      <AccountsHeaderSkeleton />

      <main className={stitchAccounts.mainStack} aria-busy="true" aria-label="Caricamento conti">
        <section className={stitchAccounts.surfaceQuiet}>
          <div className="space-y-3">
            <div>
              <SkeletonBox height="h-5" width="w-44" variant="medium" className="mb-1" />
              <SkeletonBox height="h-3.5" width="w-full" variant="light" className="max-w-md" />
            </div>
            <div className={stitchAccounts.userChipRow}>
              {[1, 2, 3].map((i) => (
                <SkeletonBox
                  key={i}
                  height="h-9"
                  width="w-24"
                  variant="light"
                  className="shrink-0 rounded-full"
                />
              ))}
            </div>
          </div>
        </section>

        <section className={cn('relative', stitchAccounts.heroNetWorthCard)}>
          <div className={stitchAccounts.heroNetWorthDecor} aria-hidden />
          <div className="relative z-1 space-y-3">
            <div>
              <SkeletonBox height="h-5" width="w-36" variant="medium" className="mb-1" />
              <SkeletonBox height="h-3.5" width="w-48" variant="light" />
            </div>
            <div>
              <SkeletonBox height="h-3" width="w-28" variant="light" />
              <SkeletonBox height="h-9" width="w-44" variant="medium" className="mt-1" />
            </div>
            <div className="mt-1 flex w-full max-w-xs gap-2">
              <SkeletonBox height="h-14" variant="light" className="flex-1 rounded-lg" />
              <SkeletonBox height="h-14" variant="light" className="flex-1 rounded-lg" />
              <SkeletonBox height="h-14" variant="light" className="flex-1 rounded-lg" />
            </div>
          </div>
        </section>

        <section className={stitchAccounts.surfaceEmphasis}>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <SkeletonBox height="h-5" width="w-32" variant="medium" className="mb-1" />
                <SkeletonBox height="h-3.5" width="w-52" variant="light" />
              </div>
              <SkeletonBox
                height="h-8"
                width="w-24"
                variant="light"
                className="shrink-0 rounded-md"
              />
            </div>
            <div className={stitchAccounts.listStack}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={stitchAccounts.listRowSkeleton}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <SkeletonBox
                      height="h-10"
                      width="w-10"
                      variant="light"
                      className="shrink-0 rounded-full"
                    />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <SkeletonBox height="h-4" width="w-[55%]" variant="light" />
                      <SkeletonBox height="h-3" width="w-20" variant="light" />
                    </div>
                  </div>
                  <SkeletonBox height="h-4" width="w-20" variant="medium" className="shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <BottomNavigation />
    </PageContainer>
  );
}
