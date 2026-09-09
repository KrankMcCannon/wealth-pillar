'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionListSkeleton } from '@/components/ui/primitives/skeletons';
import { HomePageSectionsSkeleton } from '@/components/ui/primitives/skeletons/dashboard-skeletons';
import { cn } from '@/lib/utils';
import { HomeDashboardMain } from '@/components/layout';
import { PageTabsSkeleton } from '@/components/shared/page-tabs';
import {
  stitchTransactions,
  stitchTransactionPageSearch,
  stitchPageTabs,
} from '@/styles/home-design-foundation';

interface HomePageSkeletonProps {
  skipLabel: string;
}

function HomePageSkeleton({ skipLabel }: HomePageSkeletonProps) {
  return (
    <HomeDashboardMain ariaBusy aria-label={skipLabel}>
      <HomePageSectionsSkeleton />
    </HomeDashboardMain>
  );
}

function TransactionsPageSkeleton() {
  return (
    <>
      <div className={stitchPageTabs.stickyBar}>
        <div className={stitchPageTabs.stickyStack}>
          <div className={stitchPageTabs.leading}>
            <Skeleton className="h-8 w-48 rounded-full" />
          </div>
          <PageTabsSkeleton />
        </div>
      </div>
      <HomeDashboardMain id="main-transactions-skeleton" ariaBusy className="gap-2.5 pt-1.5">
        <div className={stitchTransactions.mainStack}>
          <Skeleton className={cn(stitchTransactionPageSearch.input, 'h-11')} />
          <div className={stitchTransactions.chipRow}>
            <Skeleton className="h-7 w-14 shrink-0 rounded-full" />
            <Skeleton className="h-7 w-16 shrink-0 rounded-full" />
            <Skeleton className="h-7 w-20 shrink-0 rounded-full" />
          </div>
          <TransactionListSkeleton />
        </div>
      </HomeDashboardMain>
    </>
  );
}

export type PageLoaderVariant = 'home' | 'transactions';

interface PageLoaderProps {
  variant?: PageLoaderVariant;
  skipLabel?: string;
}

export function PageLoader({
  variant = 'home',
  skipLabel,
}: Readonly<PageLoaderProps>) {
  const tHome = useTranslations('HomeContent');
  const resolvedSkipLabel = skipLabel ?? tHome('skipToContent');

  if (variant === 'transactions') return <TransactionsPageSkeleton />;
  return <HomePageSkeleton skipLabel={resolvedSkipLabel} />;
}

export default PageLoader;
