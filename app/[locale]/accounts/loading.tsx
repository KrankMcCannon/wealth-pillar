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
} from '@/features/accounts/components/account-skeletons';
import { SkeletonBox } from '@/components/ui/primitives';

export default function AccountsLoading() {
  return (
    <PageContainer>
      <div className={accountStyles.loading.body}>
        <AccountHeaderSkeleton />

        <main className={reportsStyles.main.container}>
          <div className="space-y-5 sm:space-y-6">
            <div className="rounded-2xl border border-primary/15 bg-card/90 p-3 shadow-sm ring-1 ring-black/4 dark:ring-white/6 sm:p-4 md:p-5">
              <SkeletonBox height="h-32" variant="medium" />
            </div>
            <div className="rounded-2xl border border-primary/15 bg-card/90 p-3 shadow-sm ring-1 ring-black/4 dark:ring-white/6 sm:p-4 md:p-5">
              <AccountListSkeleton />
            </div>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </PageContainer>
  );
}
