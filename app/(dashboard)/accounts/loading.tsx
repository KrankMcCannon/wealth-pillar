/**
 * Accounts Page Loading State
 * Shown while account data is being prefetched and hydrated
 *
 * Uses centralized skeleton components from features/accounts
 * Follows consistent design system and spacing patterns
 */

import { accountStyles } from '@/features/accounts';
import {
  AccountHeaderSkeleton,
  AccountListSkeleton,
} from '@/features/accounts/components/account-skeletons';

export default function AccountsLoading() {
  return (
    <div className={accountStyles.page.container}>
      {/* Header Skeleton */}
      <AccountHeaderSkeleton />

      {/* Main Content Loading States */}
      <main className="space-y-6 px-4 py-6">
        {/* Total Balance Skeleton */}
        <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />

        {/* Accounts List Skeleton */}
        <AccountListSkeleton />
      </main>
    </div>
  );
}
