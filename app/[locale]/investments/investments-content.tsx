'use client';

import dynamic from 'next/dynamic';
import { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ActionMenu, AppPage } from '@/components/layout';
import UserSelector from '@/components/shared/user-selector';
import { User } from '@/lib';
import TabNavigation from '@/components/shared/tab-navigation';
import { transactionStyles } from '@/styles/system';
import type { Investment } from '@/features/investments/components/personal-investment-tab';
import { stitchBudgets, stitchTransactions } from '@/styles/home-design-foundation';
import { useRouter } from '@/i18n/routing';
import { PieChart } from 'lucide-react';

const PersonalInvestmentTab = dynamic(() =>
  import('@/features/investments/components/personal-investment-tab').then(
    (m) => m.PersonalInvestmentTab
  )
);

const SandboxForecastTab = dynamic(() =>
  import('@/features/investments/components/sandbox-forecast-tab').then((m) => m.SandboxForecastTab)
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
  const tActionMenu = useTranslations('Header.ActionMenu');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'personal' | 'sandbox'>('personal');

  const extraMenuItems = [
    {
      label: tActionMenu('goToBudgets'),
      icon: PieChart,
      onClick: () => router.push('/budgets'),
    },
  ];

  return (
    <AppPage
      currentUser={currentUser}
      title={t('headerTitle')}
      showBack
      showActions
      beforeHeader={
        <div className={stitchBudgets.decorWrap}>
          <div className={stitchBudgets.decorBlobTL} />
          <div className={stitchBudgets.decorBlobBR} />
        </div>
      }
      betweenHeaderAndMain={
        <>
          <div className="sticky z-30 border-b border-[#3359c5]/15 bg-[#050818]/90 pt-1 pb-3 shadow-sm backdrop-blur-sm">
            <div className="space-y-3 px-4">
              <UserSelector hideTitle currentUser={currentUser} users={groupUsers} />

              <TabNavigation
                tabs={[
                  { id: 'personal', label: t('tabs.personal') },
                  { id: 'sandbox', label: t('tabs.sandbox') },
                ]}
                activeTab={activeTab}
                onTabChange={(id) => setActiveTab(id as 'personal' | 'sandbox')}
                variant="stitch"
              />
            </div>
          </div>

          <main className={transactionStyles.page.main} aria-label={t('mainLandmark')}>
            <div className={transactionStyles.layout.contentStack}>
              {activeTab === 'personal' && (
                <PersonalInvestmentTab
                  investments={investments}
                  summary={summary}
                  indexData={indexData}
                  currentIndex={currentIndex}
                />
              )}
              {activeTab === 'sandbox' && <SandboxForecastTab />}
            </div>
          </main>
        </>
      }
      afterMain={
        <ActionMenu
          triggerClassName={stitchTransactions.fab}
          triggerIconClassName="h-6 w-6"
          extraMenuItems={extraMenuItems}
          groupedSecondary
          align="end"
        />
      }
    />
  );
}
