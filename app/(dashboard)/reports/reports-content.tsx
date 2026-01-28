"use client";

import { BottomNavigation, PageContainer, Header } from "@/components/layout";
import { PageSection, SectionHeader } from "@/components/ui";
import UserSelector from "@/components/shared/user-selector";
import YearSelector from "@/components/shared/year-selector";
import { BudgetPeriodsSection, ReportsOverviewCard, AnnualCategorySection } from "@/features/reports";
import { useReportsData } from "@/features/reports/hooks/useReportsData";
import { reportsStyles } from "@/styles/system";
import type { Transaction, Category, BudgetPeriod, Account, User, CategoryBreakdownItem } from "@/lib/types";
import type { EnrichedBudgetPeriod } from "@/server/services/report-period.service";

interface ReportsContentProps {
  accounts: Account[];
  transactions?: Transaction[];
  categories: Category[];
  budgetPeriods?: BudgetPeriod[]; // Make optional or remove if unused
  enrichedBudgetPeriods: (EnrichedBudgetPeriod & { transactionCount?: number })[]; // Using derived type
  overviewMetrics: Record<string, {
    totalEarned: number;
    totalSpent: number;
    totalTransferred: number;
    totalBalance: number;
  }>;
  annualSpending: Record<string, Record<string, CategoryBreakdownItem[]>>;
  currentUser: User;
  groupUsers: User[];
}

export default function ReportsContent({
  accounts,
  categories,
  enrichedBudgetPeriods,
  overviewMetrics,
  annualSpending,
  currentUser,
  groupUsers,
}: ReportsContentProps) {
  // Use the extracted hook for data logic
  const {
    selectedYear,
    setSelectedYear,
    activeGroupFilter,
    availableYears,
    activeBudgetPeriods,
    activeOverviewMetrics,
    activeAnnualData,
    enrichedCategories,
  } = useReportsData({
    accounts,
    categories,
    enrichedBudgetPeriods,
    overviewMetrics,
    annualSpending,
    currentUser,
    groupUsers,
  });

  return (
    <PageContainer className={reportsStyles.page.container}>
      <div>
        {/* Header */}
        <Header
          title="Rapporti"
          showBack={true}
          currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
          showActions={true}
        />

        {/* User Selector */}
        <UserSelector
          currentUser={currentUser}
          users={groupUsers}
        />

        {/* Year Selector */}
        <YearSelector
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          availableYears={availableYears}
        />

        <main className={reportsStyles.main.container}>
          {/* Overview Section - Overall Metrics */}
          <PageSection>
            <SectionHeader
              title="Panoramica Generale"
              subtitle="Metriche complessive di tutte le transazioni"
            />
            <ReportsOverviewCard
              totalEarned={activeOverviewMetrics.totalEarned}
              totalSpent={activeOverviewMetrics.totalSpent}
              totalTransferred={activeOverviewMetrics.totalTransferred}
              totalBalance={activeOverviewMetrics.totalBalance}
            />
          </PageSection>

          {/* Budget Periods Section */}
          <PageSection>
            <SectionHeader
              title="Periodi di Budget"
              subtitle="Storico periodi passati e attuali"
            />
            <BudgetPeriodsSection
              enrichedBudgetPeriods={activeBudgetPeriods}
              groupUsers={groupUsers}
              transactions={[]} // No transactions needed now
              categories={enrichedCategories}
              accounts={accounts}
              selectedUserId={activeGroupFilter}
              isLoading={false}
            />
          </PageSection>

          {/* Annual Category Breakdown */}
          <AnnualCategorySection
            annualData={activeAnnualData}
            categories={categories}
            year={selectedYear}
          />
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </PageContainer>
  );
}
