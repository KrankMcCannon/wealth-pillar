/**
 * Accounts Page Loading State
 * Shown while account data is being prefetched and hydrated
 *
 * Uses centralized skeleton components from features/accounts
 * Follows consistent design system and spacing patterns
 */

import { PageContainer, BottomNavigation } from '@/components/layout';
import { accountStyles } from '@/features/accounts';
import { reportsStyles } from '@/styles/system';
import {
  AccountHeaderSkeleton,
  AccountListSkeleton,
  BalanceCardSkeleton,
} from '@/features/accounts/components/account-skeletons';
import { SkeletonBox } from '@/components/ui/primitives';

function SectionHeadingSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonBox height="h-5" width="w-36" />
      <SkeletonBox height="h-3.5" width="max-w-md" className="w-full" variant="light" />
    </div>
  );
}

export default function AccountsLoading() {
  return (
    <PageContainer>
      <div className={accountStyles.loading.body}>
        <AccountHeaderSkeleton />

        <main className={reportsStyles.main.container} aria-busy="true">
          <section className={reportsStyles.section.surfaceQuiet}>
            <div className="space-y-3 sm:space-y-4">
              <SectionHeadingSkeleton />
              <SkeletonBox height="h-32" variant="medium" className="w-full" />
            </div>
          </section>
          <section className={reportsStyles.section.surface}>
            <div className="space-y-3 sm:space-y-4">
              <SectionHeadingSkeleton />
              <div className={accountStyles.balanceCard.container}>
                <BalanceCardSkeleton />
              </div>
            </div>
          </section>
          <section className={reportsStyles.section.surfaceEmphasis}>
            <div className="space-y-3 sm:space-y-4">
              <SectionHeadingSkeleton />
              <AccountListSkeleton />
            </div>
          </section>
        </main>
      </div>

      <BottomNavigation />
    </PageContainer>
  );
}
