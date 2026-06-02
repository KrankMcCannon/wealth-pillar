'use client';

import dynamic from 'next/dynamic';
import { Suspense, use, useCallback, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/routing';
import { AppPage, HomeDashboardMain, PageFab } from '@/components/layout';
import UserSelector from '@/components/shared/user-selector';
import { User } from '@/lib';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { PersonalInvestmentTab } from '@/features/investments/components/personal-investment-tab';
import { useInvestmentsList } from '@/features/investments/hooks/use-investments-list';
import { stitchInvestments, stitchTransactions } from '@/styles/home-design-foundation';
import { useModalState, useTabState } from '@/lib/navigation/url-state';
import type { InvestmentsPageData } from '@/server/use-cases/pages/investments-page.use-case';

const SandboxForecastTab = dynamic(
  () =>
    import('@/features/investments/components/sandbox-forecast-tab').then(
      (m) => m.SandboxForecastTab
    ),
  { ssr: false }
);

interface InvestmentsContentProps {
  currentUser: User;
  groupUsers: User[];
  pageDataPromise: Promise<InvestmentsPageData>;
}

export default function InvestmentsContent({
  currentUser,
  groupUsers,
  pageDataPromise,
}: InvestmentsContentProps) {
  const pageData = use(pageDataPromise);
  const {
    summary,
    assetAllocation,
    portfolioHistory,
    indexData,
    currentIndex,
    holdings: initialHoldings,
    hasMore: initialHasMore,
    nextCursor: initialNextCursor,
    userScope,
  } = pageData;

  const { holdings, hasMore, isLoadingMore, loadMore } = useInvestmentsList({
    initialHoldings,
    initialHasMore,
    initialNextCursor,
    userScope,
  });

  const t = useTranslations('InvestmentsContent');
  const tActionMenu = useTranslations('Header.ActionMenu');
  const { openModal } = useModalState();
  const { activeTab, setActiveTab } = useTabState('personal');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startNavigation] = useTransition();

  const selectedUser = searchParams.get('user') ?? 'all';

  const handleUserChange = useCallback(
    (userId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (userId === 'all') {
        params.delete('user');
      } else {
        params.set('user', userId);
      }
      const qs = params.toString();
      startNavigation(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <AppPage
      currentUser={currentUser}
      title={t('headerTitle')}
      showBack
      skipToMainHref="#main-investments"
      skipToMainLabel={t('mainLandmark')}
      dashboardMain
      mainId="main-investments"
      betweenHeaderAndMain={
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-col">
          <div className={stitchTransactions.tabsStickyBar}>
            <div className="flex flex-col gap-3 px-4 pt-1">
              <UserSelector
                hideTitle
                currentUser={currentUser}
                users={groupUsers}
                value={selectedUser}
                onChange={handleUserChange}
              />
              <TabsList className={stitchTransactions.tabsList} aria-label={t('mainLandmark')}>
                <TabsTrigger className={stitchTransactions.tabsTrigger} value="personal">
                  {t('tabs.personal')}
                </TabsTrigger>
                <TabsTrigger className={stitchTransactions.tabsTrigger} value="sandbox">
                  {t('tabs.sandbox')}
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <HomeDashboardMain id="main-investments" aria-label={t('mainLandmark')}>
            <TabsContent value="personal" className="mt-0">
              <div className={stitchInvestments.mainStack}>
                <PersonalInvestmentTab
                  summary={summary}
                  assetAllocation={assetAllocation}
                  portfolioHistory={portfolioHistory}
                  indexData={indexData}
                  currentIndex={currentIndex}
                  holdings={holdings}
                  hasMore={hasMore}
                  isLoadingMore={isLoadingMore}
                  onLoadMore={loadMore}
                />
              </div>
            </TabsContent>

            <TabsContent value="sandbox" className="mt-0">
              <div className={stitchInvestments.mainStack}>
                <Suspense fallback={null}>
                  <SandboxForecastTab />
                </Suspense>
              </div>
            </TabsContent>
          </HomeDashboardMain>
        </Tabs>
      }
      afterMain={
        <PageFab
          onClick={() => openModal('investment')}
          ariaLabel={tActionMenu('newInvestment')}
          testId="investments-fab-add"
        />
      }
    />
  );
}
