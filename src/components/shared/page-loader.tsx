'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionListSkeleton } from '@/components/ui/primitives/skeletons';
import { HomePageSectionsSkeleton } from '@/components/ui/primitives/skeletons/dashboard-skeletons';
import { cn } from '@/lib/utils';
import { HomeDashboardMain } from '@/components/layout';
import { stitchTransactions, stitchTransactionPageSearch } from '@/styles/home-design-foundation';

const pageLoaderStyles = {
  page: 'relative flex w-full min-h-[100svh] flex-col bg-card',
  container: 'flex-1 flex items-center justify-center',
  content: 'text-center',
  iconWrap:
    'flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4 animate-pulse motion-reduce:animate-none',
  icon: 'w-8 h-8 text-primary animate-spin motion-reduce:animate-none',
  message: 'text-sm font-semibold text-primary',
  submessage: 'text-xs text-primary/70 mt-1',
} as const;

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

function ListPageSkeleton() {
  return (
    <div className="px-3 pt-2 pb-24" aria-busy="true">
      <TransactionListSkeleton />
    </div>
  );
}

function TransactionsPageSkeleton() {
  return (
    <div className="px-4 pt-1 pb-24" aria-busy="true">
      <div className={stitchTransactions.tabsStickyBar}>
        <Skeleton className={cn(stitchTransactions.tabsList, 'h-12')} />
      </div>
      <div className={cn(stitchTransactions.mainStack, 'mt-3')}>
        <Skeleton className={cn(stitchTransactionPageSearch.input, 'h-11')} />
        <div className={stitchTransactions.chipRow}>
          <Skeleton className="h-9 w-16 shrink-0 rounded-full" />
          <Skeleton className="h-9 w-20 shrink-0 rounded-full" />
          <Skeleton className="h-9 w-24 shrink-0 rounded-full" />
        </div>
        <TransactionListSkeleton />
      </div>
    </div>
  );
}

export type PageLoaderVariant = 'home' | 'list' | 'transactions' | 'form';

interface PageLoaderProps {
  variant?: PageLoaderVariant;
  message?: string;
  submessage?: string;
  skipLabel?: string;
}

function FormPageLoader({
  message,
  submessage,
}: Readonly<Pick<PageLoaderProps, 'message' | 'submessage'>>) {
  const t = useTranslations('Common.PageLoader');
  const resolvedMessage = message ?? t('message');
  const resolvedSubmessage = submessage ?? t('submessage');

  return (
    <div className={pageLoaderStyles.page}>
      <div className={pageLoaderStyles.container}>
        <div className={pageLoaderStyles.content}>
          <div className={pageLoaderStyles.iconWrap}>
            <svg
              className={pageLoaderStyles.icon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <p className={pageLoaderStyles.message}>{resolvedMessage}</p>
          <p className={pageLoaderStyles.submessage}>{resolvedSubmessage}</p>
        </div>
      </div>
    </div>
  );
}

export function PageLoader({
  variant = 'form',
  message,
  submessage,
  skipLabel,
}: Readonly<PageLoaderProps>) {
  const tHome = useTranslations('HomeContent');
  const resolvedSkipLabel = skipLabel ?? tHome('skipToContent');

  if (variant === 'home') return <HomePageSkeleton skipLabel={resolvedSkipLabel} />;
  if (variant === 'transactions') return <TransactionsPageSkeleton />;
  if (variant === 'list') return <ListPageSkeleton />;
  return (
    <FormPageLoader
      {...(message !== undefined ? { message } : {})}
      {...(submessage !== undefined ? { submessage } : {})}
    />
  );
}

export default PageLoader;
