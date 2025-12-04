/**
 * Accounts Page Loading State
 * Shown while account data is being prefetched and hydrated
 *
 * Uses centralized skeleton components from features/accounts
 * Follows consistent design system and spacing patterns
 */

import { PageContainer, BottomNavigation } from "@/components/layout";
import { accountStyles } from '@/features/accounts';
import {
  AccountHeaderSkeleton,
  AccountListSkeleton,
} from '@/features/accounts/components/account-skeletons';
import { SkeletonBox } from "@/components/ui/primitives";

export default function AccountsLoading() {
  return (
    <PageContainer className={accountStyles.page.container}>
      <div className="flex-1">
        {/* Header Skeleton */}
        <AccountHeaderSkeleton />

        {/* Main Content Loading States */}
        <main className="space-y-6 px-4 py-6">
          {/* Total Balance Skeleton */}
          <SkeletonBox height="h-32" variant="medium" />

          {/* Accounts List Skeleton */}
          <AccountListSkeleton />
        </main>
      </div>

      <BottomNavigation />
    </PageContainer>
  );
}
