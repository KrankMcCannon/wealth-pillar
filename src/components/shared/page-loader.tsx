'use client';

import { useTranslations } from 'next-intl';
import {
  BottomNavigation,
  HomeDashboardMain,
  PageContainer,
  SkipToMainLink,
} from '@/components/layout';
import { headerStyles } from '@/components/layout/theme/header-styles';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionListSkeleton } from '@/components/ui/primitives/skeletons';
import { cn } from '@/lib/utils';
import { STICKY_HEADER_BASE } from '@/lib/utils/ui-constants';
import { stitchHome } from '@/styles/home-design-foundation';

const pageLoaderStyles = {
  page: 'relative flex w-full min-h-[100svh] flex-col bg-card md:pl-64',
  container: 'flex-1 flex items-center justify-center',
  content: 'text-center',
  iconWrap:
    'flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4 animate-pulse motion-reduce:animate-none',
  icon: 'w-8 h-8 text-primary animate-spin motion-reduce:animate-none',
  message: 'text-sm font-semibold text-primary',
  submessage: 'text-xs text-primary/70 mt-1',
} as const;

function HeaderSkeleton() {
  return (
    <header className={cn(STICKY_HEADER_BASE, headerStyles.container)}>
      <div className={headerStyles.inner}>
        <div className={headerStyles.slotLeft}>
          <Skeleton className="size-11 rounded-full" />
        </div>
        <div className={headerStyles.slotCenter}>
          <Skeleton className="h-5 w-36" />
        </div>
        <div className={headerStyles.slotRight}>
          <Skeleton className="size-11 rounded-full" />
        </div>
      </div>
    </header>
  );
}

function HomeListBlockSkeleton() {
  return (
    <section className={stitchHome.sectionCard} aria-hidden>
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-14" />
      </div>
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className={stitchHome.listRow}>
            <Skeleton className="size-8 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-4 w-[60%]" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
}

function BalanceBlockSkeleton() {
  return (
    <section className={stitchHome.balanceSection} aria-hidden>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-11 shrink-0 rounded-2xl" />
          <div className="flex min-w-0 flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-36 max-w-full" />
          </div>
        </div>
        <Skeleton className="size-8 shrink-0 rounded-full" />
      </div>
    </section>
  );
}

interface HomePageSkeletonProps {
  skipLabel: string;
}

function HomePageSkeleton({ skipLabel }: HomePageSkeletonProps) {
  return (
    <PageContainer>
      <SkipToMainLink href="#main-dashboard">{skipLabel}</SkipToMainLink>
      <HeaderSkeleton />
      <HomeDashboardMain ariaBusy>
        <BalanceBlockSkeleton />
        <HomeListBlockSkeleton />
        <HomeListBlockSkeleton />
        <HomeListBlockSkeleton />
      </HomeDashboardMain>
      <BottomNavigation />
    </PageContainer>
  );
}

function ListPageSkeleton() {
  return (
    <PageContainer>
      <HeaderSkeleton />
      <div className="px-3 pt-2 pb-24" aria-busy="true">
        <TransactionListSkeleton />
      </div>
      <BottomNavigation />
    </PageContainer>
  );
}

export type PageLoaderVariant = 'home' | 'list' | 'form';

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
  if (variant === 'list') return <ListPageSkeleton />;
  return (
    <FormPageLoader
      {...(message !== undefined ? { message } : {})}
      {...(submessage !== undefined ? { submessage } : {})}
    />
  );
}

export default PageLoader;
