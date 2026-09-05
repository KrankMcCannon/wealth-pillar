import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonList } from '@/components/ui/primitives';
import { HomeDashboardMain } from '@/components/layout/home-dashboard-layout';
import { stitchBudgets } from '@/styles/home-design-foundation';

export const BudgetCardSkeleton = () => (
  <div className="rounded-xl border border-border/25 bg-card p-4">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <Skeleton className="mt-2 h-7 w-24" />
    <Skeleton className="mt-2 h-2 w-full rounded-full" />
  </div>
);

export const BudgetListSkeleton = () => (
  <SkeletonList count={3} spacing="flex flex-col gap-4" renderItem={() => <BudgetCardSkeleton />} />
);

export const BudgetDetailsSkeleton = () => (
  <HomeDashboardMain id="main-budget-detail-skeleton">
    <div className={stitchBudgets.mainStack}>
      <div className="flex justify-end">
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className={stitchBudgets.categoryCard}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
        <Skeleton className="mt-4 h-2 w-full rounded-full" />
      </div>
      <TransactionListSkeleton />
    </div>
  </HomeDashboardMain>
);

export const TransactionListSkeleton = () => (
  <SkeletonList
    count={4}
    spacing="flex flex-col gap-3"
    renderItem={() => (
      <div className="rounded-xl border border-border/25 bg-card p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    )}
  />
);

export const BudgetPageSkeleton = () => (
  <HomeDashboardMain id="main-budgets-skeleton">
    <div className={stitchBudgets.mainStack}>
      <Skeleton className="h-8 w-full rounded-full" />
      <div className={stitchBudgets.periodHeader}>
        <Skeleton className="h-4 w-36" />
        <Skeleton className="size-11 rounded-lg" />
      </div>
      <div className={stitchBudgets.heroSection}>
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-2 h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <BudgetListSkeleton />
      <div className={stitchBudgets.detailChartCard}>
        <div className={stitchBudgets.detailChartHeader}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-7 w-32" />
        </div>
        <Skeleton className="mx-4 mb-4 h-40 rounded-lg" />
      </div>
    </div>
  </HomeDashboardMain>
);

export default BudgetPageSkeleton;
