"use client";

import { useMemo, useState } from "react";
import { BottomNavigation, PageContainer, Header } from "@/components/layout";
import { PageSection, SectionHeader } from "@/components/ui";
import { useUserFilter, usePermissions, useFilteredData } from "@/hooks";
import UserSelector from "@/components/shared/user-selector";
import YearSelector from "@/components/shared/year-selector";
import { BudgetPeriodsSection, ReportsOverviewCard, AnnualCategorySection } from "@/features/reports";
import { reportsStyles } from "@/styles/system";
import type { Transaction, Category, BudgetPeriod, Account, User } from "@/lib/types";
import { FinanceLogicService } from "@/server/services/finance-logic.service";
import { toDateTime } from "@/lib/utils/date-utils";

interface ReportsContentProps {
  accounts: Account[];
  transactions?: Transaction[];
  categories: Category[];
  budgetPeriods?: BudgetPeriod[]; // Make optional or remove if unused
  enrichedBudgetPeriods: any[]; // Using derived type
  overviewMetrics: Record<string, {
    totalEarned: number;
    totalSpent: number;
    totalTransferred: number;
    totalBalance: number;
  }>;
  annualSpending: Record<string, Record<number, any[]>>;
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
  // Year filtering state management
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear());

  // User filtering state management using shared hook
  const { selectedGroupFilter } = useUserFilter();

  // Permission checks
  const { isMember } = usePermissions({
    currentUser,
    selectedUserId: selectedGroupFilter === "all" ? undefined : selectedGroupFilter,
  });

  // Force members to see only their own data
  const activeGroupFilter = isMember ? currentUser.id : selectedGroupFilter;

  // Extract available years from annualSpending keys (instead of transactions)
  const availableYears = useMemo(() => {
    // Collect years from all user's annualSpending
    const years = new Set<number>();
    // If filtering by user, assume 'all' key or specific user key contains years
    // Actually we can iterate over annualSpending['all'] fields
    const data = annualSpending['all'] || {};
    Object.keys(data).forEach(year => years.add(Number(year)));
    return Array.from(years).sort((a, b) => b - a);
  }, [annualSpending]);

  // Filter budget periods by user/year
  // Now we filter enrichedBudgetPeriods directly
  const { filteredData: userFilteredBudgetPeriods } = useFilteredData({
    data: enrichedBudgetPeriods,
    currentUser,
    selectedUserId: activeGroupFilter === "all" ? undefined : activeGroupFilter,
  });

  const activeBudgetPeriods = useMemo(() => {
    if (selectedYear === 'all') return userFilteredBudgetPeriods;

    return userFilteredBudgetPeriods.filter(period => {
      const dt = toDateTime(period.start_date);
      return dt?.year === selectedYear;
    });
  }, [userFilteredBudgetPeriods, selectedYear]);

  // Select Overview Metrics from Map
  const activeOverviewMetrics = useMemo(() => {
    return overviewMetrics[activeGroupFilter] || overviewMetrics['all'];
  }, [overviewMetrics, activeGroupFilter]);

  // Select Annual Data from Map
  const activeAnnualData = useMemo(() => {
    // Get year map for user
    const userMap = annualSpending[activeGroupFilter] || annualSpending['all'];
    if (selectedYear === 'all') {
      // Aggregate all years if 'all' selected? Or just pass empty/all?
      // Component expects array. Simple approach: Only support single year breakdown for now?
      // Or aggregate values.
      // For 'all', we might want to sum up.
      // Let's grab 'all' metrics if year is 'all'? No, annualSpending structure is Year -> Breakdown
      // If year is 'all', we can flatten?
      return userMap[new Date().getFullYear()] || []; // Default to current year for breakdown if 'all' selected for now
    }
    return userMap[selectedYear] || [];
  }, [annualSpending, activeGroupFilter, selectedYear]);


  // Prepare categories (static)
  const enrichedCategories = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      label: FinanceLogicService.getCategoryLabel(categories, category.key),
      color: FinanceLogicService.getCategoryColor(categories, category.key),
      icon: FinanceLogicService.getCategoryIcon(categories, category.key),
    }));
  }, [categories]);

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
              selectedUserId={selectedGroupFilter}
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
