"use client";

import { useMemo } from "react";
import { BottomNavigation, PageContainer, Header } from "@/components/layout";
import { useUserFilter, usePermissions, useFilteredAccounts } from "@/hooks";
import UserSelector from "@/src/components/shared/user-selector";
import { BudgetPeriodsSection, reportsStyles, ReportsOverviewCard, AnnualCategorySection } from "@/features/reports";
import type { Transaction, Category, BudgetPeriod } from "@/lib/types";
import { CategoryService } from "@/lib/services";
import { ReportMetricsService } from "@/lib/services/report-metrics.service";
import type { Account } from "@/lib/types";
import { useCurrentUser, useGroupUsers } from "@/stores/reference-data-store";

interface ReportsContentProps {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
}

export default function ReportsContent({
  accounts,
  transactions,
  categories,
}: ReportsContentProps) {
  // Read from stores instead of props
  const currentUser = useCurrentUser();
  const groupUsers = useGroupUsers();

  // Early return if store not initialized
  if (!currentUser) {
    return null;
  }
  // User filtering state management using shared hook
  const { selectedGroupFilter } = useUserFilter();

  // Permission checks
  const { isMember } = usePermissions({
    currentUser,
    selectedUserId: selectedGroupFilter !== "all" ? selectedGroupFilter : undefined,
  });

  // Force members to see only their own data
  const activeGroupFilter = isMember ? currentUser.id : selectedGroupFilter;

  // TODO: Budget periods display in reports currently disabled
  // The refactored architecture stores only active periods in the page-data-store.
  // To show historical budget periods in reports, we need to:
  // 1. Add a method in BudgetPeriodService to fetch all periods for a user/group
  // 2. Fetch all periods in the reports page server component
  // 3. Pass them as props and store them separately from active periods
  // For now, returning empty array to prevent errors
  const allBudgetPeriods = useMemo<BudgetPeriod[]>(() => {
    return [];
  }, []);

  // Get user account IDs for earned/spent calculation
  // Using centralized account filtering hook
  const { filteredAccounts: userAccounts } = useFilteredAccounts({
    accounts,
    currentUser,
    selectedUserId: activeGroupFilter !== "all" ? activeGroupFilter : undefined,
  });
  const userAccountIds = useMemo(() => userAccounts.map((a) => a.id), [userAccounts]);

  // Calculate overview metrics (total earned, spent, transferred, balance)
  const overviewMetrics = useMemo(() => {
    const userId = activeGroupFilter === "all" ? undefined : activeGroupFilter;
    return ReportMetricsService.calculateOverviewMetrics(transactions, userAccountIds, userId);
  }, [transactions, userAccountIds, activeGroupFilter]);

  // Enrich category metrics with category details (label, color, icon)
  const enrichedCategories = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      label: CategoryService.getCategoryLabel(categories, category.key),
      color: CategoryService.getCategoryColor(categories, category.key),
      icon: CategoryService.getCategoryIcon(categories, category.key),
    }));
  }, [categories]);

  // Filter transactions for active user/group context (for Annual Section)
  const activeTransactions = useMemo(() => {
    if (activeGroupFilter === "all") return transactions;
    return transactions.filter(t => t.user_id === activeGroupFilter);
  }, [transactions, activeGroupFilter]);

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
        <UserSelector />

        <main className={reportsStyles.main.container}>
          {/* Overview Section - Overall Metrics */}
          <section>
            <div className={reportsStyles.sectionHeader.container}>
              <h2 className={reportsStyles.sectionHeader.title}>Panoramica Generale</h2>
              <p className={reportsStyles.sectionHeader.subtitle}>Metriche complessive di tutte le transazioni</p>
            </div>
            <ReportsOverviewCard
              totalEarned={overviewMetrics.totalEarned}
              totalSpent={overviewMetrics.totalSpent}
              totalTransferred={overviewMetrics.totalTransferred}
              totalBalance={overviewMetrics.totalBalance}
            />
          </section>

          {/* Budget Periods Section */}
          <section>
            <div className={reportsStyles.sectionHeader.container}>
              <h2 className={reportsStyles.sectionHeader.title}>Periodi di Budget</h2>
              <p className={reportsStyles.sectionHeader.subtitle}>Storico periodi passati e attuali</p>
            </div>
            <BudgetPeriodsSection
              budgetPeriods={allBudgetPeriods}
              groupUsers={groupUsers}
              transactions={transactions}
              categories={enrichedCategories}
              accounts={accounts}
              selectedUserId={selectedGroupFilter}
              isLoading={false}
            />
          </section>

          {/* Annual Category Breakdown */}
          <AnnualCategorySection
            transactions={activeTransactions}
            categories={categories}
          />
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </PageContainer>
  );
}
