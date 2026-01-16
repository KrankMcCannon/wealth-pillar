"use client";

import { useMemo, useState } from "react";
import { BottomNavigation, PageContainer, Header } from "@/components/layout";
import { PageSection, SectionHeader } from "@/components/ui";
import { useUserFilter, usePermissions, useFilteredAccounts, useFilteredData } from "@/hooks";
import UserSelector from "@/components/shared/user-selector";
import YearSelector from "@/components/shared/year-selector";
import { BudgetPeriodsSection, ReportsOverviewCard, AnnualCategorySection } from "@/features/reports";
import { reportsStyles } from "@/styles/system";
import type { Transaction, Category, BudgetPeriod, Account, User } from "@/lib/types";
import { FinanceLogicService } from "@/server/services/finance-logic.service";
import { ReportMetricsService } from "@/server/services/report-metrics.service";
import { toDateTime } from "@/lib/utils/date-utils";

interface ReportsContentProps {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgetPeriods: BudgetPeriod[];
  currentUser: User;
  groupUsers: User[];
}

export default function ReportsContent({
  accounts,
  transactions,
  categories,
  budgetPeriods,
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

  // Extract available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach(transaction => {
      const dt = toDateTime(transaction.date);
      if (dt) {
        years.add(dt.year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Descending order
  }, [transactions]);

  // Filter transactions by selected year
  const yearFilteredTransactions = useMemo(() => {
    if (selectedYear === 'all') return transactions;

    return transactions.filter(t => {
      const dt = toDateTime(t.date);
      return dt?.year === selectedYear;
    });
  }, [transactions, selectedYear]);

  // Filter budget periods by selected year
  const { filteredData: userFilteredBudgetPeriods } = useFilteredData({
    data: budgetPeriods,
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

  // Get user account IDs for earned/spent calculation
  // Using centralized account filtering hook
  const { filteredAccounts: userAccounts } = useFilteredAccounts({
    accounts,
    currentUser,
    selectedUserId: activeGroupFilter === "all" ? undefined : activeGroupFilter,
  });
  const userAccountIds = useMemo(() => userAccounts.map((a) => a.id), [userAccounts]);

  // Calculate overview metrics with year-filtered transactions
  const overviewMetrics = useMemo(() => {
    const userId = activeGroupFilter === "all" ? undefined : activeGroupFilter;
    return ReportMetricsService.calculateOverviewMetrics(yearFilteredTransactions, userAccountIds, userId);
  }, [yearFilteredTransactions, userAccountIds, activeGroupFilter]);

  // Enrich category metrics with category details (label, color, icon)
  const enrichedCategories = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      label: FinanceLogicService.getCategoryLabel(categories, category.key),
      color: FinanceLogicService.getCategoryColor(categories, category.key),
      icon: FinanceLogicService.getCategoryIcon(categories, category.key),
    }));
  }, [categories]);

  // Filter transactions for active user/group context AND selected year
  const activeTransactions = useMemo(() => {
    if (activeGroupFilter === "all") return yearFilteredTransactions;
    return yearFilteredTransactions.filter(t => t.user_id === activeGroupFilter);
  }, [yearFilteredTransactions, activeGroupFilter]);

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
              totalEarned={overviewMetrics.totalEarned}
              totalSpent={overviewMetrics.totalSpent}
              totalTransferred={overviewMetrics.totalTransferred}
              totalBalance={overviewMetrics.totalBalance}
            />
          </PageSection>

          {/* Budget Periods Section */}
          <PageSection>
            <SectionHeader
              title="Periodi di Budget"
              subtitle="Storico periodi passati e attuali"
            />
            <BudgetPeriodsSection
              budgetPeriods={activeBudgetPeriods}
              groupUsers={groupUsers}
              transactions={yearFilteredTransactions}
              categories={enrichedCategories}
              accounts={accounts}
              selectedUserId={selectedGroupFilter}
              isLoading={false}
            />
          </PageSection>

          {/* Annual Category Breakdown */}
          <AnnualCategorySection
            transactions={activeTransactions}
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
