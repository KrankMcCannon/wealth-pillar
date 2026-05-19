'use client';

import { useTranslations } from 'next-intl';
import {
  BottomNavigation,
  HomeDashboardMain,
  PageContainer,
  SkipToMainLink,
} from '@/components/layout';
import { headerStyles } from '@/components/layout/theme/header-styles';
import { SkeletonBox } from '@/components/ui/primitives/skeleton-box';
import { TransactionListSkeleton } from '@/components/ui/primitives/skeletons';
import { cn } from '@/lib/utils';
import { STICKY_HEADER_BASE } from '@/lib/utils/ui-constants';
import { stitchHome } from '@/styles/home-design-foundation';
import { pageLoaderStyles } from './theme/page-loader-styles';

const SKIP_LINK_LABEL = 'Skip to balances, budgets, and recurring items';

function HeaderSkeleton() {
  return (
    <header className={cn(STICKY_HEADER_BASE, headerStyles.container)}>
      <div className={headerStyles.inner}>
        <div className={headerStyles.slotLeft}>
          <SkeletonBox height="h-9" width="w-9" variant="light" className="rounded-full" />
        </div>
        <div className={headerStyles.slotCenter}>
          <SkeletonBox height="h-5" width="w-36" variant="medium" />
        </div>
        <div className={headerStyles.slotRight}>
          <SkeletonBox height="h-9" width="w-9" variant="light" className="rounded-full" />
        </div>
      </div>
    </header>
  );
}

function HomeListBlockSkeleton() {
  return (
    <section className={stitchHome.sectionCard} aria-hidden>
      <div className="mb-3 flex items-center justify-between">
        <SkeletonBox height="h-5" width="w-36" variant="medium" />
        <SkeletonBox height="h-4" width="w-14" variant="light" />
      </div>
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className={stitchHome.listRow}>
            <SkeletonBox height="h-8" width="w-8" variant="light" className="shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <SkeletonBox height="h-4" width="w-[60%]" variant="light" />
              <SkeletonBox height="h-3" width="w-20" variant="light" />
            </div>
            <SkeletonBox height="h-4" width="w-16" variant="medium" className="shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
}

function HomePageSkeleton() {
  return (
    <PageContainer>
      <SkipToMainLink href="#main-dashboard">{SKIP_LINK_LABEL}</SkipToMainLink>
      <HeaderSkeleton />
      <HomeDashboardMain ariaBusy>
        <section className={stitchHome.balanceSection} aria-hidden>
          <SkeletonBox height="h-24" width="w-full" variant="light" className="rounded-2xl" />
        </section>
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

export function PageLoader({ variant = 'form', message, submessage }: Readonly<PageLoaderProps>) {
  if (variant === 'home') return <HomePageSkeleton />;
  if (variant === 'list') return <ListPageSkeleton />;
  return (
    <FormPageLoader
      {...(message !== undefined ? { message } : {})}
      {...(submessage !== undefined ? { submessage } : {})}
    />
  );
}

export default PageLoader;
