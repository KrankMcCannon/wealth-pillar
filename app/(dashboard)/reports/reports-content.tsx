"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import BottomNavigation from "@/src/components/layout/bottom-navigation";
import UserSelector from "@/src/components/shared/user-selector";
import { SpendingOverviewCard, CategoryBreakdownSection, SavingsGoalCard, reportsStyles } from "@/features/reports";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui";
import type { DashboardDataProps } from "@/lib/auth/get-dashboard-data";
import type { Transaction, ReportMetrics, Category } from "@/lib/types";
import { TransactionService, CategoryService } from "@/lib/services";
import { SAVINGS_GOAL_NUMBER } from "@/features/transactions/constants";

interface ReportsContentProps extends DashboardDataProps {
  transactions: Transaction[];
  categories: Category[];
  initialMetrics: ReportMetrics;
}

export default function ReportsContent({ currentUser, groupUsers, transactions, categories }: ReportsContentProps) {
  const router = useRouter();
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");

  // Month navigation state (initialize with current month)
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  // Get month label
  const monthLabel = useMemo(() => {
    return TransactionService.getMonthLabel(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Filter transactions by selected month
  const monthlyTransactions = useMemo(() => {
    return TransactionService.filterByMonth(transactions, selectedYear, selectedMonth);
  }, [transactions, selectedYear, selectedMonth]);

  // Calculate monthly metrics
  const metrics = useMemo(() => {
    const userId = selectedGroupFilter === "all" ? undefined : selectedGroupFilter;
    return TransactionService.calculateReportMetrics(monthlyTransactions, userId);
  }, [selectedGroupFilter, monthlyTransactions]);

  // Calculate savings goal metrics (only "risparmi" category)
  // Uses current month for full year YTD calculation (not selectedMonth)
  // Always shows total for all users (not affected by user selector)
  const currentMonth = now.getMonth();
  const savingsGoalMetrics = useMemo(() => {
    return TransactionService.calculateSavingsGoalMetrics(transactions, currentMonth);
  }, [transactions, currentMonth]);

  // Month navigation handlers
  const handlePreviousMonth = () => {
    const { year, month } = TransactionService.getPreviousMonth(selectedYear, selectedMonth);
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleNextMonth = () => {
    const { year, month } = TransactionService.getNextMonth(selectedYear, selectedMonth);
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  // Enrich category metrics with category details (label, color, icon)
  const enrichedCategories = useMemo(() => {
    return metrics.categories.map((catMetric) => ({
      ...catMetric,
      label: CategoryService.getCategoryLabel(categories, catMetric.name),
      color: CategoryService.getCategoryColor(categories, catMetric.name),
      icon: CategoryService.getCategoryIcon(categories, catMetric.name),
    }));
  }, [metrics.categories, categories]);

  return (
    <div className={reportsStyles.page.container} style={reportsStyles.page.style}>
      <div>
        {/* Header */}
        <header className={reportsStyles.header.container}>
          <div className={reportsStyles.header.inner}>
            <Button variant="ghost" size="sm" className={reportsStyles.header.button} onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <h1 className={reportsStyles.header.title}>Rapporti</h1>
            <div className={reportsStyles.header.spacer}></div>
          </div>
        </header>

        {/* User Selector */}
        <UserSelector
          users={groupUsers}
          currentUser={currentUser}
          selectedGroupFilter={selectedGroupFilter}
          onGroupFilterChange={setSelectedGroupFilter}
        />

        <main className={reportsStyles.main.container}>
          {/* Savings Goal - Year-to-Date (uses current year, not selected month) */}
          <section>
            <div className={reportsStyles.sectionHeader.container}>
              <h2 className={reportsStyles.sectionHeader.title}>Obiettivi di risparmio</h2>
              <p className={reportsStyles.sectionHeader.subtitle}>Progresso annuale</p>
            </div>
            <SavingsGoalCard
              currentSavings={savingsGoalMetrics.total}
              savingsGoal={SAVINGS_GOAL_NUMBER}
              projectedYearEnd={savingsGoalMetrics.projected}
              projectedMonthly={savingsGoalMetrics.monthlyAverage}
              monthlyTarget={SAVINGS_GOAL_NUMBER / 12}
              totalToReach={Math.max(0, SAVINGS_GOAL_NUMBER - savingsGoalMetrics.total)}
            />
          </section>

          {/* Month Selector - Before Monthly Sections */}
          <div className="flex items-center justify-center gap-3 px-3 sm:px-4 py-4 border-t border-b border-primary/10">
            <Button variant="ghost" size="sm" className={reportsStyles.header.button} onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold text-black capitalize min-w-[150px] text-center">{monthLabel}</span>
            <Button variant="ghost" size="sm" className={reportsStyles.header.button} onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Spending Overview - Monthly (uses selected month) */}
          <section>
            <SpendingOverviewCard
              income={metrics.income}
              expenses={metrics.expenses}
              netSavings={metrics.netSavings}
              savingsRate={metrics.savingsRate}
            />
          </section>

          {/* Category Breakdown - Monthly Top 5 (uses selected month) */}
          <section>
            <div className={reportsStyles.sectionHeader.container}>
              <h2 className={reportsStyles.sectionHeader.title}>Spesa per categoria</h2>
              <p className={reportsStyles.sectionHeader.subtitle}>Top 5</p>
            </div>
            <CategoryBreakdownSection
              categories={enrichedCategories as any}
              allCategories={categories}
              transactions={monthlyTransactions}
              users={groupUsers}
              selectedUserId={selectedGroupFilter}
              isLoading={false}
            />
          </section>
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
