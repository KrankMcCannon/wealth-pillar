"use client";

import React, { useMemo } from "react";
import { BottomNavigation, PageContainer, PageHeaderWithBack } from "@/src/components/layout";
import { useUserFilter } from "@/hooks";
import UserSelector from "@/src/components/shared/user-selector";
import {
  TransactionSplitCard,
  BudgetPeriodsSection,
  reportsStyles,
} from "@/features/reports";
import type { DashboardDataProps } from "@/lib/auth/get-dashboard-data";
import type { Transaction, Category, BudgetPeriod } from "@/lib/types";
import { TransactionService, CategoryService } from "@/lib/services";
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

  // Aggregate budget periods from all users or selected user
  const allBudgetPeriods = useMemo<BudgetPeriod[]>(() => {
    if (selectedGroupFilter === "all") {
      // Ensure each period has correct user_id when aggregating from all users
      return groupUsers.flatMap((user) =>
        (user.budget_periods || []).map((period) => ({
          ...period,
          user_id: user.id, // Ensure user_id matches the owning user
        }))
      );
    }
    const selectedUser = groupUsers.find((u) => u.id === selectedGroupFilter);
    if (!selectedUser) return [];
    return (selectedUser.budget_periods || []).map((period) => ({
      ...period,
      user_id: selectedUser.id, // Ensure user_id is set correctly
    }));
  }, [selectedGroupFilter, groupUsers]);

  // Get user account IDs for earned/spent calculation
  const userAccountIds = useMemo(() => {
    if (selectedGroupFilter === "all") {
      return accounts.map((a) => a.id);
    }
    return accounts
      .filter((a) => a.user_ids.includes(selectedGroupFilter))
      .map((a) => a.id);
  }, [selectedGroupFilter, accounts]);

  // Calculate transaction split metrics (earned vs spent)
  const splitMetrics = useMemo(() => {
    const userId = selectedGroupFilter === "all" ? undefined : selectedGroupFilter;
    const earned = TransactionService.calculateEarned(
      transactions,
      userAccountIds,
      userId
    );
    const spent = TransactionService.calculateSpent(
      transactions,
      userAccountIds,
      userId
    );
    return { earned, spent };
  }, [transactions, userAccountIds, selectedGroupFilter]);

  // Enrich category metrics with category details (label, color, icon)
  const enrichedCategories = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      label: CategoryService.getCategoryLabel(categories, category.key),
      color: CategoryService.getCategoryColor(categories, category.key),
      icon: CategoryService.getCategoryIcon(categories, category.key),
    }));
  }, [categories]);

  return (
    <PageContainer className={reportsStyles.page.container}>
      <div>
        {/* Header */}
        <PageHeaderWithBack title="Rapporti" />

        {/* User Selector */}
        <UserSelector
          users={groupUsers}
          currentUser={currentUser}
          selectedGroupFilter={selectedGroupFilter}
          onGroupFilterChange={setSelectedGroupFilter}
        />

        <main className={reportsStyles.main.container}>
          {/* Transaction Split - Earned vs Spent */}
          <section>
            <div className={reportsStyles.sectionHeader.container}>
              <h2 className={reportsStyles.sectionHeader.title}>Transazioni</h2>
              <p className={reportsStyles.sectionHeader.subtitle}>Totali guadagnati e spesi</p>
            </div>
            <TransactionSplitCard
              earned={splitMetrics.earned}
              spent={splitMetrics.spent}
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
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </PageContainer>
  );
}
