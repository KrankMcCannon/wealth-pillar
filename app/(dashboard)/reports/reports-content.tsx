"use client";

import { useMemo } from "react";
import { BottomNavigation, PageContainer, Header } from "@/components/layout";
import { useUserFilter, usePermissions, useFilteredAccounts } from "@/hooks";
import UserSelector from "@/src/components/shared/user-selector";
import { BudgetPeriodsSection, reportsStyles, ReportsOverviewCard, AnnualCategorySection } from "@/features/reports";
import type { DashboardDataProps } from "@/lib/auth/get-dashboard-data";
import type { Transaction, Category, BudgetPeriod } from "@/lib/types";
import { CategoryService } from "@/lib/services";
import { ReportMetricsService } from "@/lib/services/report-metrics.service";
import type { Account } from "@/lib/types";

interface ReportsContentProps extends DashboardDataProps {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
}

export default function ReportsContent({
  currentUser,
  groupUsers,
  accounts,
  transactions,
  categories,
}: ReportsContentProps) {
  // User filtering state management using shared hook
  const { selectedGroupFilter, setSelectedGroupFilter } = useUserFilter();

  // Permission checks
  const { isMember } = usePermissions({
    currentUser,
    selectedUserId: selectedGroupFilter !== "all" ? selectedGroupFilter : undefined,
  });

  // Force members to see only their own data
  const activeGroupFilter = isMember ? currentUser.id : selectedGroupFilter;

  // Aggregate budget periods from all users or selected user
  // Members only see their own budget periods
  const allBudgetPeriods = useMemo<BudgetPeriod[]>(() => {
    if (isMember) {
      // Members see only their own budget periods
      return (currentUser.budget_periods || []).map((period) => ({
        ...period,
        user_id: currentUser.id,
      }));
    }

    // Admin logic
    if (activeGroupFilter === "all") {
      // Ensure each period has correct user_id when aggregating from all users
      return groupUsers.flatMap((user) =>
        (user.budget_periods || []).map((period) => ({
          ...period,
          user_id: user.id, // Ensure user_id matches the owning user
        })),
      );
    }
    const selectedUser = groupUsers.find((u) => u.id === activeGroupFilter);
    if (!selectedUser) return [];
    return (selectedUser.budget_periods || []).map((period) => ({
      ...period,
      user_id: selectedUser.id, // Ensure user_id is set correctly
    }));
  }, [activeGroupFilter, groupUsers, isMember, currentUser]);

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
          data={{
            currentUser: { ...currentUser, role: currentUser.role || 'member' },
            groupUsers,
            accounts,
            categories,
            groupId: currentUser.group_id
          }}
        />

        {/* User Selector */}
        <UserSelector
          users={groupUsers}
          currentUser={currentUser}
          selectedGroupFilter={selectedGroupFilter}
          onGroupFilterChange={setSelectedGroupFilter}
        />

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
