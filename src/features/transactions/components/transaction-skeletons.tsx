'use client';

/**
 * Modern skeleton components for transactions pages
 * Uses project palette and smooth animations
 */

import { SkeletonList } from '@/components/ui/primitives';
import { SHIMMER_BASE } from '@/lib/utils/ui-constants';
import { transactionStyles } from '@/styles/system';

export const TransactionHeaderSkeleton = () => (
  <header className={`${transactionStyles.skeletons.header} ${SHIMMER_BASE}`}>
    <div className={transactionStyles.skeletons.headerRow}>
      <div className={transactionStyles.skeletons.headerIcon} />
      <div className={transactionStyles.skeletons.headerTitle} />
      <div className={transactionStyles.skeletons.headerIcon} />
    </div>
  </header>
);

export const UserSelectorSkeleton = () => (
  <section className={`${transactionStyles.skeletons.userSelector} ${SHIMMER_BASE}`}>
    <SkeletonList
      count={3}
      spacing={transactionStyles.skeletons.userSelectorListSpacing}
      style={transactionStyles.skeletons.userSelectorListStyle}
      renderItem={() => (
        <div className={transactionStyles.skeletons.userSelectorChip}>
          <div className={transactionStyles.skeletons.userSelectorDot} />
          <div className={transactionStyles.skeletons.userSelectorText} />
        </div>
      )}
    />
  </section>
);

export const TransactionCardSkeleton = () => (
  <div className={`${transactionStyles.skeletons.card} ${SHIMMER_BASE}`}>
    <div className={transactionStyles.skeletons.cardRow}>
      <div className={transactionStyles.skeletons.cardIcon} />
      <div className={transactionStyles.skeletons.cardBody}>
        <div className={transactionStyles.skeletons.cardLinePrimary} />
        <div className={transactionStyles.skeletons.cardLineSecondary} />
      </div>
      <div className={transactionStyles.skeletons.cardAmount}>
        <div className={transactionStyles.skeletons.cardAmountLine} />
        <div className={transactionStyles.skeletons.cardAmountSub} />
      </div>
    </div>
  </div>
);

export const TransactionDayGroupSkeleton = () => (
  <div className={transactionStyles.skeletons.dayGroup}>
    {/* Day header */}
    <div className={transactionStyles.skeletons.dayGroupHeader}>
      <div className={transactionStyles.skeletons.dayGroupTitle} />
      <div className={transactionStyles.skeletons.dayGroupTotal}>
        <div className={transactionStyles.skeletons.dayGroupTotalLine} />
        <div className={transactionStyles.skeletons.dayGroupTotalSub} />
      </div>
    </div>

    {/* Transaction cards */}
    <SkeletonList
      count={3}
      spacing={transactionStyles.skeletons.dayGroupListSpacing}
      renderItem={() => <TransactionCardSkeleton />}
    />
  </div>
);

export const TransactionListSkeleton = () => (
  <SkeletonList
    count={3}
    spacing={transactionStyles.skeletons.listSpacing}
    renderItem={() => <TransactionDayGroupSkeleton />}
  />
);

export const TabNavigationSkeleton = () => (
  <div className={`${transactionStyles.skeletons.tabNav} ${SHIMMER_BASE}`}>
    <SkeletonList
      count={2}
      spacing={transactionStyles.skeletons.tabListSpacing}
      height={transactionStyles.skeletons.tabPillHeight}
      width={transactionStyles.skeletons.tabPillWidth}
      className={transactionStyles.skeletons.tabPill}
    />
  </div>
);

export const RecurringSeriesSkeleton = () => (
  <div className={`${transactionStyles.skeletons.recurring} ${SHIMMER_BASE}`}>
    <SkeletonList
      count={3}
      spacing={transactionStyles.skeletons.recurringListSpacing}
      renderItem={() => (
        <div className={transactionStyles.skeletons.recurringRow}>
          <div className={transactionStyles.skeletons.recurringIcon} />
          <div className={transactionStyles.skeletons.recurringBody}>
            <div className={transactionStyles.skeletons.recurringLinePrimary} />
            <div className={transactionStyles.skeletons.recurringLineSecondary} />
          </div>
          <div className={transactionStyles.skeletons.recurringAction} />
        </div>
      )}
    />
  </div>
);

export const FullTransactionsPageSkeleton = () => (
  <div className={transactionStyles.skeletons.fullPage}>
    {/* Header skeleton */}
    <TransactionHeaderSkeleton />

    {/* User selector skeleton */}
    <UserSelectorSkeleton />

    {/* Tab navigation skeleton */}
    <TabNavigationSkeleton />

    {/* Main content skeleton */}
    <main className={transactionStyles.skeletons.main}>
      {/* Transactions list */}
      <TransactionListSkeleton />
    </main>
  </div>
);

export default FullTransactionsPageSkeleton;
