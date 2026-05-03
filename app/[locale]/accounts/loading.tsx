/**
 * Accounts Page Loading State
 * Shown while account data is being prefetched and hydrated
 *
 * Uses centralized skeleton components from features/accounts
 * Follows consistent design system and spacing patterns
 */

import { PageContainer, BottomNavigation } from '@/components/layout';
import { accountStyles } from '@/features/accounts';
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

        <main className={accountStyles.pageLayout.main} aria-busy="true">
          <section className={accountStyles.pageLayout.surfaceQuiet}>
            <div className="space-y-3">
              <SectionHeadingSkeleton />
              <SkeletonBox height="h-32" variant="medium" className="w-full" />
            </div>
          </section>
          <section className={accountStyles.pageLayout.surface}>
            <div className="space-y-3">
              <SectionHeadingSkeleton />
              <div className={accountStyles.balanceCard.container}>
                <BalanceCardSkeleton />
              </div>
            </div>
          </section>
          <section className={accountStyles.pageLayout.surfaceEmphasis}>
            <div className="space-y-3">
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
