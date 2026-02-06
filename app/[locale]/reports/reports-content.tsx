'use client';

import { BottomNavigation, PageContainer, Header } from '@/components/layout';
import { PageSection } from '@/components/ui';
import { SummarySection, PeriodsSection, CategoriesSection } from '@/features/reports';
import { useTranslations } from 'next-intl';
import type {
  AccountTypeSummary,
  ReportPeriodSummary,
  CategoryStat,
} from '@/server/services/reports.service';
import type { User } from '@/lib/types';

interface ReportsContentProps {
  accountTypeSummary: AccountTypeSummary[];
  periodSummaries: ReportPeriodSummary[];
  incomeStats: CategoryStat[];
  expenseStats: CategoryStat[];
  currentUser: User;
  groupUsers: User[];
}

export default function ReportsContent({
  accountTypeSummary,
  periodSummaries,
  incomeStats,
  expenseStats,
  currentUser,
  groupUsers,
}: ReportsContentProps) {
  const t = useTranslations('ReportsContent');

  return (
    <PageContainer>
      <Header
        title={t('headerTitle')}
        showBack={true}
        currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
      />

      <div className="space-y-8 pt-4 pb-10 px-4">
        {/* Summary by Account Type */}
        <PageSection>
          <SummarySection data={accountTypeSummary} />
        </PageSection>

        {/* Report Periods */}
        <PageSection>
          <PeriodsSection data={periodSummaries} users={groupUsers} />
        </PageSection>

        {/* Categories */}
        <PageSection>
          <CategoriesSection incomeStats={incomeStats} expenseStats={expenseStats} />
        </PageSection>
      </div>

      <BottomNavigation />
    </PageContainer>
  );
}
