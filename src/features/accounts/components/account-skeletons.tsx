/**
 * Account Skeleton Components
 * Progressive loading placeholders with smooth animations
 */

import { SkeletonList } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';
import { SHIMMER_BASE } from '@/lib/utils/ui-constants';
import { accountStyles } from '../theme/account-styles';

/**
 * Header skeleton loader for accounts page
 */
export function AccountHeaderSkeleton() {
  return (
    <header className={accountStyles.skeleton.header.container}>
      <div className={accountStyles.skeleton.header.row}>
        <div className={accountStyles.skeleton.header.left}>
          <div className={accountStyles.skeleton.header.icon} />
          <div className={accountStyles.skeleton.list.body}>
            <div className={accountStyles.skeleton.header.title} />
            <div className={accountStyles.skeleton.header.subtitle} />
          </div>
        </div>
        <div className={accountStyles.skeleton.header.action} />
      </div>
    </header>
  );
}

/**
 * Total balance card skeleton
 */
export function BalanceCardSkeleton() {
  return (
    <div className={accountStyles.skeleton.balance.container}>
      <div className={`${accountStyles.skeleton.balance.card} ${SHIMMER_BASE}`}>
        {/* Header */}
        <div className={accountStyles.skeleton.balance.header}>
          <div>
            <div className={accountStyles.skeleton.balance.label} />
            <div className={accountStyles.skeleton.balance.value} />
          </div>
          <div className={accountStyles.skeleton.balance.avatar} />
        </div>

        {/* Statistics grid */}
        <SkeletonList
          count={3}
          spacing={accountStyles.skeleton.balance.statsGrid}
          renderItem={() => (
            <div className={accountStyles.skeleton.balance.statCard}>
              <div className={accountStyles.skeleton.balance.statRow}>
                <div className={accountStyles.skeleton.balance.statIcon} />
                <div className={accountStyles.skeleton.balance.statLabel} />
              </div>
              <div className={accountStyles.skeleton.balance.statValue} />
            </div>
          )}
        />
      </div>
    </div>
  );
}

/**
 * Account list skeleton
 */
export function AccountListSkeleton() {
  return (
    <div className={accountStyles.skeleton.list.container}>
      <div className={accountStyles.skeleton.list.title} />
      <SkeletonList
        count={3}
        spacing="space-y-3"
        renderItem={() => (
          <div className={`${accountStyles.skeleton.list.item} ${SHIMMER_BASE}`}>
            <div className={accountStyles.skeleton.list.row}>
              <div className={accountStyles.skeleton.list.left}>
                <div className={accountStyles.skeleton.list.icon} />
                <div className={accountStyles.skeleton.list.body}>
                  <div className={accountStyles.skeleton.list.line} />
                  <div className={accountStyles.skeleton.list.subline} />
                </div>
              </div>
              <div className={accountStyles.skeleton.list.right}>
                <div className={accountStyles.skeleton.list.amount} />
                <div className={accountStyles.skeleton.list.amountSub} />
              </div>
            </div>
          </div>
        )}
      />
    </div>
  );
}

/**
 * Account slider skeleton (for dashboard balance section)
 */
export function BalanceSectionSliderSkeleton() {
  return (
    <div className={accountStyles.slider.container}>
      <div className={accountStyles.slider.inner}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(accountStyles.slider.skeletonCard, SHIMMER_BASE)}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Full accounts page skeleton
 */
export function AccountsPageSkeleton() {
  return (
    <div className={accountStyles.skeleton.page.container}>
      <AccountHeaderSkeleton />
      <BalanceCardSkeleton />
      <AccountListSkeleton />
    </div>
  );
}

export default AccountsPageSkeleton;
