/**
 * BudgetLoadingSkeletons Component
 * Skeleton screens for mobile-friendly progressive loading
 * Shows shimmer animations while data loads
 */

'use client';

import { budgetStyles } from '@/styles/system';
import React from 'react';

/**
 * Skeleton for budget selector
 */
export function BudgetSelectorSkeleton() {
  return (
    <div className={budgetStyles.selectionSection}>
      {/* Section Header Skeleton */}
      <div className={budgetStyles.loadingSkeletons.header}>
        <div className={`${budgetStyles.skeleton.base} ${budgetStyles.skeleton.lineMedium} ${budgetStyles.loadingSkeletons.selectorTitle}`} />
        <div className={`${budgetStyles.skeleton.base} ${budgetStyles.skeleton.lineShort} ${budgetStyles.loadingSkeletons.selectorSubtitle}`} />
      </div>

      {/* Selector Skeleton */}
      <div className={`${budgetStyles.skeleton.base} ${budgetStyles.skeleton.rect} ${budgetStyles.loadingSkeletons.selectorBox}`} />
    </div>
  );
}

/**
 * Skeleton for budget display card
 */
export function BudgetCardSkeleton() {
  return (
    <div className={`${budgetStyles.budgetDisplay.container} animate-pulse`}>
      {/* Header row skeleton */}
      <div className={budgetStyles.budgetDisplay.headerRow}>
        <div className={budgetStyles.budgetDisplay.headerContent}>
          {/* Icon skeleton */}
          <div className={`${budgetStyles.skeleton.rect} w-12 h-12 rounded-xl`} />

          {/* Text skeleton */}
          <div className={budgetStyles.loadingSkeletons.budgetCardText}>
            <div className={`${budgetStyles.skeleton.line} ${budgetStyles.loadingSkeletons.budgetCardTitle}`} />
            <div className={`${budgetStyles.skeleton.lineShort} ${budgetStyles.loadingSkeletons.budgetCardSubtitle}`} />
          </div>
        </div>

        {/* Period skeleton */}
        <div className={budgetStyles.loadingSkeletons.budgetCardPeriod}>
          <div className={`${budgetStyles.skeleton.lineShort} ${budgetStyles.loadingSkeletons.budgetCardPeriodLine}`} />
          <div className={`${budgetStyles.skeleton.line} ${budgetStyles.loadingSkeletons.budgetCardPeriodValue}`} />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for financial metrics
 */
export function BudgetMetricsSkeleton() {
  return (
    <div className={budgetStyles.metrics.container}>
      {[1, 2, 3].map((i) => (
        <div key={i} className={`${budgetStyles.skeleton.base} ${budgetStyles.metrics.item}`}>
          <div className={`${budgetStyles.skeleton.lineShort} h-3 mb-2`} />
          <div className={`${budgetStyles.skeleton.line} h-6`} />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for progress section
 */
export function BudgetProgressSkeleton() {
  return (
    <div className={`${budgetStyles.progress.container} animate-pulse`}>
      {/* Header skeleton */}
      <div className={budgetStyles.progress.header}>
        <div className={budgetStyles.loadingSkeletons.progressIndicatorRow}>
          <div className={`${budgetStyles.skeleton.rect} ${budgetStyles.loadingSkeletons.progressIndicator}`} />
          <div className={`${budgetStyles.skeleton.lineMedium} h-4`} />
        </div>
        <div className={`${budgetStyles.skeleton.lineShort} ${budgetStyles.loadingSkeletons.progressValue}`} />
      </div>

      {/* Bar skeleton */}
      <div className={budgetStyles.progress.barContainer}>
        <div className={`${budgetStyles.skeleton.rect} h-3 w-1/2 rounded-full`} />
      </div>

      {/* Status text skeleton */}
      <div className={budgetStyles.loadingSkeletons.progressStatus}>
        <div className={`${budgetStyles.skeleton.line} ${budgetStyles.loadingSkeletons.progressStatusLine}`} />
      </div>
    </div>
  );
}

/**
 * Skeleton for chart section
 */
export function BudgetChartSkeleton() {
  return (
    <section className={budgetStyles.loadingSkeletons.section}>
      <div className={`${budgetStyles.skeleton.rect} ${budgetStyles.loadingSkeletons.chartCard}`}>
        {/* Header skeleton */}
        <div className={budgetStyles.loadingSkeletons.chartHeader}>
          <div>
            <div className={`${budgetStyles.skeleton.lineShort} h-3 mb-2`} />
            <div className={`${budgetStyles.skeleton.line} h-6 w-32`} />
          </div>
        </div>

        {/* Chart skeleton */}
        <div className={`${budgetStyles.chart.svgContainer} ${budgetStyles.loadingSkeletons.chartWrap}`}>
          <div className={`${budgetStyles.skeleton.rect} ${budgetStyles.loadingSkeletons.chartArea}`} />
        </div>

        {/* Labels skeleton */}
        <div className={budgetStyles.loadingSkeletons.chartFooter}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${budgetStyles.skeleton.lineShort} h-3`} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Skeleton for empty selected budget state
 */
export function BudgetSelectorOnlySkeleton() {
  return (
    <div className={budgetStyles.page.main}>
      <BudgetSelectorSkeleton />
    </div>
  );
}

/**
 * Full page loading skeleton
 */
export function FullBudgetPageSkeleton() {
  return (
    <div className={budgetStyles.loadingSkeletons.list}>
      <BudgetSelectorSkeleton />
      <BudgetCardSkeleton />
      <BudgetMetricsSkeleton />
      <BudgetProgressSkeleton />
      <BudgetChartSkeleton />
      {/* Transaction list uses TransactionDayListSkeleton from @/features/transactions */}
    </div>
  );
}
