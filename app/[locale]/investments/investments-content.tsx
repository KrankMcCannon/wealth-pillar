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
import type { Investment } from '@/features/investments/components/personal-investment-tab';
import { PersonalInvestmentTab } from '@/features/investments/components/personal-investment-tab';
import { stitchTransactions } from '@/styles/home-design-foundation';
import { useModalState, useTabState } from '@/lib/navigation/url-state';

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
  investmentsDataPromise: Promise<{
    investments: Investment[];
    summary: {
      totalInvested: number;
      totalTaxPaid?: number;
      totalPaid?: number;
      totalCurrentValue: number;
      totalInitialValue?: number;
      totalReturn: number;
      totalReturnPercent: number;
    };
    assetAllocation: { symbol: string; value: number }[];
    portfolioHistory: { date: string; value: number }[];
    indexData: Array<{
      datetime?: string | undefined;
      time?: string | undefined;
      date?: string | undefined;
      close: string | number;
    }>;
    currentIndex: string;
  }>;
}

export default function InvestmentsContent({
  currentUser,
  groupUsers,
  investmentsDataPromise,
}: InvestmentsContentProps) {
  const { investments, summary, assetAllocation, portfolioHistory, indexData, currentIndex } =
    use(investmentsDataPromise);
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
              <div className={stitchTransactions.mainStack}>
                <PersonalInvestmentTab
                  investments={investments}
                  summary={summary}
                  assetAllocation={assetAllocation}
                  portfolioHistory={portfolioHistory}
                  indexData={indexData}
                  currentIndex={currentIndex}
                />
              </div>
            </TabsContent>

            <TabsContent value="sandbox" className="mt-0">
              <div className={stitchTransactions.mainStack}>
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
