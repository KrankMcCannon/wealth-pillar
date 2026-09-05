'use client';

import dynamic from 'next/dynamic';
import { Suspense, use, useCallback, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/routing';
import { HomeDashboardMain, PageFab } from '@/components/layout';
import { usePageHeader } from '@/hooks/use-page-header';
import UserSelector from '@/components/shared/user-selector';
import { PageTabsSticky } from '@/components/shared/page-tabs';
import { User } from '@/lib';
import { PersonalInvestmentTab } from '@/features/investments/components/personal-investment-tab';
import { stitchInvestments } from '@/styles/home-design-foundation';
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
  const { summary, assetAllocation, portfolioHistory, indexData, currentIndex, holdings } =
    pageData;

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

  usePageHeader({
    title: t('headerTitle'),
    showBack: true,
    isDashboard: false,
  });

  return (
    <>
      <PageTabsSticky
        value={activeTab}
        onValueChange={setActiveTab}
        ariaLabel={t('mainLandmark')}
        items={[
          { value: 'personal', label: t('tabs.personal') },
          { value: 'sandbox', label: t('tabs.sandbox') },
        ]}
        leading={
          <UserSelector
            hideTitle
            currentUser={currentUser}
            users={groupUsers}
            value={selectedUser}
            onChange={handleUserChange}
          />
        }
      />

      <HomeDashboardMain id="main-investments">
        {activeTab === 'sandbox' ? (
          <div className={stitchInvestments.mainStack}>
            <Suspense fallback={null}>
              <SandboxForecastTab />
            </Suspense>
          </div>
        ) : (
          <div className={stitchInvestments.mainStack}>
            <PersonalInvestmentTab
              summary={summary}
              assetAllocation={assetAllocation}
              portfolioHistory={portfolioHistory}
              indexData={indexData}
              currentIndex={currentIndex}
              holdings={holdings}
            />
          </div>
        )}
      </HomeDashboardMain>
      <PageFab
        onClick={() => openModal('investment')}
        ariaLabel={tActionMenu('newInvestment')}
        testId="investments-fab-add"
      />
    </>
  );
}
