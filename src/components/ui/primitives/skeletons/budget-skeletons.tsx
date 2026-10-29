import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonList } from '@/components/ui/primitives';
import { HomeDashboardMain } from '@/components/layout/home-dashboard-layout';
import { stitchBudgets, stitchHome } from '@/styles/home-design-foundation';

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
  <HomeDashboardMain id="main-budget-detail-skeleton" ariaBusy>
    <div className={stitchBudgets.mainStack}>
      <div className="flex justify-end">
        <Skeleton className="h-9 w-20" />
      </div>
      <div className={stitchBudgets.categoryCard}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="mt-2 h-4 w-48" />
        <Skeleton className="mt-4 h-2 w-full rounded-full" />
      </div>
      <section className={stitchHome.scanSection}>
        <Skeleton className="h-4 w-36" />
        <ul className={stitchHome.plainList}>
          {[1, 2, 3].map((i) => (
            <li key={i} className={stitchHome.plainRow}>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16 shrink-0" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  </HomeDashboardMain>
);

export const BudgetPageSkeleton = () => (
  <HomeDashboardMain id="main-budgets-skeleton" ariaBusy>
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
