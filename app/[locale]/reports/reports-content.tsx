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
        showActions={true}
      />

      <main className="px-3 pb-24 pt-4 md:pb-8">
        <div className="space-y-4 md:space-y-6">
          {/* Summary by Account Type */}
          <PageSection variant="card" padding="md">
            <SummarySection data={accountTypeSummary} />
          </PageSection>

          <div className="space-y-4 md:grid md:grid-cols-12 md:items-start md:gap-6 md:space-y-0">
            {/* Report Periods */}
            <PageSection variant="card" padding="md" className="md:col-span-7">
              <PeriodsSection data={periodSummaries} users={groupUsers} />
            </PageSection>

            {/* Mobile view is intentionally simplified */}
            <PageSection variant="card" padding="md" className="hidden md:col-span-5 md:block">
              <CategoriesSection incomeStats={incomeStats} expenseStats={expenseStats} />
            </PageSection>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </PageContainer>
  );
}
