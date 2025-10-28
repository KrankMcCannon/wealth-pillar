/**
 * BudgetLoadingSkeletons Component
 * Skeleton screens for mobile-friendly progressive loading
 * Shows shimmer animations while data loads
 */

'use client';

import { budgetStyles } from '../theme/budget-styles';
import React from 'react';

/**
 * Skeleton for budget selector
 */
export function BudgetSelectorSkeleton() {
  return (
    <div className={budgetStyles.selectionSection}>
      {/* Section Header Skeleton */}
      <div className="mb-4">
        <div className={`${budgetStyles.skeleton.base} ${budgetStyles.skeleton.lineMedium} mb-2 h-6`} />
        <div className={`${budgetStyles.skeleton.base} ${budgetStyles.skeleton.lineShort} h-4`} />
      </div>

      {/* Selector Skeleton */}
      <div className={`${budgetStyles.skeleton.base} ${budgetStyles.skeleton.rect} h-14 rounded-xl`} />
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
          <div className="flex-1">
            <div className={`${budgetStyles.skeleton.line} h-5 mb-2`} />
            <div className={`${budgetStyles.skeleton.lineShort} h-3`} />
          </div>
        </div>

        {/* Period skeleton */}
        <div className="shrink-0">
          <div className={`${budgetStyles.skeleton.lineShort} h-3 mb-2`} />
          <div className={`${budgetStyles.skeleton.line} h-4 w-24`} />
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
        <div className="flex items-center gap-2">
          <div className={`${budgetStyles.skeleton.rect} w-2 h-2 rounded-full`} />
          <div className={`${budgetStyles.skeleton.lineMedium} h-4`} />
        </div>
        <div className={`${budgetStyles.skeleton.lineShort} h-5`} />
      </div>

      {/* Bar skeleton */}
      <div className={budgetStyles.progress.barContainer}>
        <div className={`${budgetStyles.skeleton.rect} h-3 w-1/2 rounded-full`} />
      </div>

      {/* Status text skeleton */}
      <div className="text-center">
        <div className={`${budgetStyles.skeleton.line} h-3 w-1/2 mx-auto`} />
      </div>
    </div>
  );
}

/**
 * Skeleton for chart section
 */
export function BudgetChartSkeleton() {
  return (
    <section className="animate-pulse">
      <div className={`${budgetStyles.skeleton.rect} p-0 rounded-2xl border border-primary/20 overflow-hidden`}>
        {/* Header skeleton */}
        <div className="px-6 pt-5 pb-2 flex items-start justify-between">
          <div>
            <div className={`${budgetStyles.skeleton.lineShort} h-3 mb-2`} />
            <div className={`${budgetStyles.skeleton.line} h-6 w-32`} />
          </div>
        </div>

        {/* Chart skeleton */}
        <div className={`${budgetStyles.chart.svgContainer} relative`}>
          <div className={`${budgetStyles.skeleton.rect} w-full h-32 rounded`} />
        </div>

        {/* Labels skeleton */}
        <div className="px-6 pb-4 flex justify-between gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${budgetStyles.skeleton.lineShort} h-3`} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Skeleton for transaction list
 */
export function BudgetTransactionsListSkeleton() {
  return (
    <section className="animate-pulse">
      {/* Section header skeleton */}
      <div className="mb-4">
        <div className={`${budgetStyles.skeleton.lineMedium} h-6 mb-2`} />
        <div className={`${budgetStyles.skeleton.lineShort} h-4`} />
      </div>

      {/* Transaction items skeleton */}
      <div className={budgetStyles.transactions.container}>
        {[1, 2].map((dayGroup) => (
          <div key={dayGroup}>
            {/* Day header skeleton */}
            <div className={budgetStyles.transactions.dayHeader}>
              <div className={`${budgetStyles.skeleton.line} h-5 w-32`} />
              <div className="text-right">
                <div className={`${budgetStyles.skeleton.lineShort} h-4 ml-auto mb-1`} />
                <div className={`${budgetStyles.skeleton.lineShort} h-3`} />
              </div>
            </div>

            {/* Transaction items */}
            <div className="space-y-2">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className={`${budgetStyles.skeleton.rect} h-16 rounded-lg`}
                />
              ))}
            </div>
          </div>
        ))}
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
    <div className="space-y-4 sm:space-y-6">
      <BudgetSelectorSkeleton />
      <BudgetCardSkeleton />
      <BudgetMetricsSkeleton />
      <BudgetProgressSkeleton />
      <BudgetChartSkeleton />
      <BudgetTransactionsListSkeleton />
    </div>
  );
}
