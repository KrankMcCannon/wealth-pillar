"use client";

/**
 * Modern skeleton components for budget pages
 * Uses project palette and smooth animations
 */

import { SkeletonList } from "@/components/ui/primitives";
import { SHIMMER_BASE } from "@/lib/utils/ui-constants";
import { budgetStyles } from "../theme/budget-styles";

export const BudgetCardSkeleton = () => (
  <div className={`${budgetStyles.skeleton.budgetCard} ${SHIMMER_BASE}`}>
    <div className={budgetStyles.skeleton.budgetCardRow}>
      <div className={budgetStyles.skeleton.budgetCardIcon} />
      <div className={budgetStyles.skeleton.budgetCardBody}>
        <div className={budgetStyles.skeleton.budgetCardTitle} />
        <div className={budgetStyles.skeleton.budgetCardMetaRow}>
          <div className={budgetStyles.skeleton.budgetCardDot} />
          <div className={budgetStyles.skeleton.budgetCardMeta} />
        </div>
      </div>
      <div className={budgetStyles.skeleton.budgetCardRight}>
        <div className={budgetStyles.skeleton.budgetCardAmount} />
        <div className={budgetStyles.skeleton.budgetCardSubAmount} />
      </div>
    </div>
    <div className={budgetStyles.skeleton.budgetCardBar} />
  </div>
);

export const BudgetListSkeleton = () => (
  <SkeletonList
    count={3}
    spacing="space-y-3"
    renderItem={() => <BudgetCardSkeleton />}
  />
);

export const BudgetDetailsSkeleton = () => (
  <div className={`${budgetStyles.skeleton.detailsCard} ${SHIMMER_BASE}`}>
    <div className={budgetStyles.skeleton.detailsHeader}>
      <div className={budgetStyles.skeleton.detailsLeft}>
        <div className={budgetStyles.skeleton.detailsTitle} />
        <div className={budgetStyles.skeleton.detailsSubtitle} />
      </div>
      <div className={budgetStyles.skeleton.detailsRight}>
        <div className={budgetStyles.skeleton.detailsAmount} />
        <div className={budgetStyles.skeleton.detailsAmountSub} />
      </div>
    </div>

    {/* Progress bar */}
    <div className={budgetStyles.skeleton.detailsBar} />

    {/* Stats */}
    <div className={budgetStyles.skeleton.detailsStats}>
      <div>
        <div className={budgetStyles.skeleton.detailsStatLabel} />
        <div className={budgetStyles.skeleton.detailsStatValue} />
      </div>
      <div>
        <div className={budgetStyles.skeleton.detailsStatLabel} />
        <div className={budgetStyles.skeleton.detailsStatValue} />
      </div>
    </div>
  </div>
);

export const TransactionListSkeleton = () => (
  <SkeletonList
    count={4}
    spacing="space-y-3"
    renderItem={() => (
      <div className={`${budgetStyles.skeleton.txCard} ${SHIMMER_BASE}`}>
        <div className={budgetStyles.skeleton.txRow}>
          <div className={budgetStyles.skeleton.txIcon} />
          <div className={budgetStyles.skeleton.txBody}>
            <div className={budgetStyles.skeleton.txTitle} />
            <div className={budgetStyles.skeleton.txMeta} />
          </div>
          <div className={budgetStyles.skeleton.txRight}>
            <div className={budgetStyles.skeleton.txAmount} />
            <div className={budgetStyles.skeleton.txAmountSub} />
          </div>
        </div>
      </div>
    )}
  />
);

export const BudgetPageSkeleton = () => (
  <div className={budgetStyles.skeleton.page}>
    {/* Header skeleton */}
    <header className={budgetStyles.skeleton.pageHeader}>
      <div className={budgetStyles.skeleton.pageHeaderRow}>
        <div className={budgetStyles.skeleton.pageHeaderLeft}>
          <div className={budgetStyles.skeleton.pageHeaderIcon} />
          <div>
            <div className={budgetStyles.skeleton.pageHeaderText} />
            <div className={budgetStyles.skeleton.pageHeaderSubtext} />
          </div>
        </div>
        <div className={budgetStyles.skeleton.pageHeaderAction} />
      </div>
    </header>

    {/* User selector skeleton */}
    <section className={budgetStyles.skeleton.selectorSection}>
      <SkeletonList
        count={3}
        spacing={budgetStyles.skeleton.selectorList}
        style={budgetStyles.skeleton.selectorListStyle}
        renderItem={() => (
          <div className={budgetStyles.skeleton.selectorItem}>
            <div className={budgetStyles.skeleton.selectorIcon} />
            <div className={budgetStyles.skeleton.selectorText} />
          </div>
        )}
      />
    </section>

    {/* Main content skeleton */}
    <main className={budgetStyles.skeleton.pageMain}>
      <div className={budgetStyles.skeleton.pageMainBody}>
        {/* Section header */}
        <div>
          <div className={budgetStyles.skeleton.pageSectionTitle} />
          <div className={budgetStyles.skeleton.pageSectionSubtitle} />
        </div>

        {/* Budget list */}
        <BudgetListSkeleton />

        {/* Details section */}
        <div className={budgetStyles.skeleton.pageDetails}>
          <div className={budgetStyles.skeleton.pageDetailsActions}>
            <div className={budgetStyles.skeleton.pageDetailsAction} />
            <div className={budgetStyles.skeleton.pageDetailsAction} />
          </div>
          <BudgetDetailsSkeleton />
        </div>
      </div>
    </main>
  </div>
);

export default BudgetPageSkeleton;
