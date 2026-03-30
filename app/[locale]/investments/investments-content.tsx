'use client';

import dynamic from 'next/dynamic';
import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageContainer, Header, BottomNavigation } from '@/components/layout';
import UserSelector from '@/components/shared/user-selector';
import { User } from '@/lib';
import TabNavigation from '@/components/shared/tab-navigation';
import { transactionStyles } from '@/styles/system';
import type { Investment } from '@/components/investments/personal-investment-tab';

function InvestmentsTabPanelSkeleton() {
  const t = useTranslations('InvestmentsContent');
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t('tabLoading')}
      className="min-h-[220px] w-full animate-pulse rounded-xl bg-muted"
    />
  );
}

const PersonalInvestmentTab = dynamic(
  () =>
    import('@/components/investments/personal-investment-tab').then((m) => m.PersonalInvestmentTab),
  { loading: () => <InvestmentsTabPanelSkeleton /> }
);

const SandboxForecastTab = dynamic(
  () => import('@/components/investments/sandbox-forecast-tab').then((m) => m.SandboxForecastTab),
  { loading: () => <InvestmentsTabPanelSkeleton /> }
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
  const { investments, summary, indexData, currentIndex } = use(investmentsDataPromise);
  const t = useTranslations('InvestmentsContent');
  const [activeTab, setActiveTab] = useState('personal');

  return (
    <PageContainer>
      <div className="flex-1">
        <Header
          title={t('headerTitle')}
          showBack
          currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
          showActions
        />

        <UserSelector currentUser={currentUser} users={groupUsers} />

        <main className="px-3 pb-24 md:pb-8" aria-label={t('mainLandmark')}>
          {/* Mobile-first flow: only mandatory portfolio view */}
          <div className="md:hidden">
            <PersonalInvestmentTab
              investments={investments}
              summary={summary}
              indexData={indexData}
              currentIndex={currentIndex}
            />
          </div>

          {/* Desktop flow: full investment workspace with tabs */}
          <div className="hidden space-y-4 md:block">
            <div className={transactionStyles.tabNavigation.wrapper}>
              <TabNavigation
                tabs={[
                  { id: 'personal', label: t('tabs.personal') },
                  { id: 'sandbox', label: t('tabs.sandbox') },
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                variant="modern"
              />
            </div>

            {activeTab === 'personal' && (
              <div className={transactionStyles.page.main}>
                <PersonalInvestmentTab
                  investments={investments}
                  summary={summary}
                  indexData={indexData}
                  currentIndex={currentIndex}
                />
              </div>
            )}
            {activeTab === 'sandbox' && (
              <div className={transactionStyles.page.main}>
                <SandboxForecastTab />
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNavigation />
    </PageContainer>
  );
}
