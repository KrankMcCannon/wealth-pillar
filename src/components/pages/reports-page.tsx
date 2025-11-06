"use client";

import React from "react";
import BottomNavigation from "@/src/components/layout/bottom-navigation";
import { PageLoader } from "@/src/components/shared";
import UserSelector from "@/src/components/shared/user-selector";
import { useReportsController } from "@/src/features/dashboard/hooks/use-reports-controller";
import { useCategories } from "@/src/lib/hooks/use-query-hooks";
import {
  SpendingOverviewCard,
  CategoryBreakdownSection,
  SavingsGoalCard,
  reportsStyles,
} from "@/features/reports";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui";

export function ReportsPage() {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  // Controller orchestrates all business logic
  const {
    currentUser,
    selectedViewUserId,
    users,
    financialData,
    isLoading,
    updateViewUserId,
    handleBackClick,
  } = useReportsController();

  // Fetch categories
  const { data: categories = [] } = useCategories();

  // Create a map of category keys to labels
  const categoryLabelMap = React.useMemo(() => {
    return categories.reduce(
      (acc, cat) => {
        acc[cat.key] = cat.label;
        return acc;
      },
      {} as Record<string, string>
    );
  }, [categories]);

  // Show loader while data is loading
  if (isLoading) {
    return <PageLoader message="Caricamento report..." />;
  }

  if (!financialData) {
    return <PageLoader message="Nessun dato disponibile..." />;
  }

  // Get all transactions (already filtered by user in controller)
  const allTransactions = financialData.transactions || [];

  // Filter transactions for the selected month
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

  const currentMonthTransactions = allTransactions.filter(t => {
    const txDate = new Date(t.date);
    return txDate >= monthStart && txDate <= monthEnd;
  });

  // Calculate current month metrics
  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'income' || t.category === 'stipendio')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Calculate category breakdown for current month
  const expensesByCategory = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const categoryBreakdown = Object.entries(expensesByCategory)
    .map(([categoryKey, spent]) => ({
      category: categoryLabelMap[categoryKey] || categoryKey,
      spent,
      percentage: totalExpenses > 0 ? (spent / totalExpenses) * 100 : 0,
      trend: 'stable' as const,
      trendPercent: 0,
    }))
    .sort((a, b) => b.spent - a.spent);

  // Calculate yearly savings from "risparmi" category (year to date)
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const today = new Date();

  // Get all transactions with "risparmi" category from year to date
  const yearSavingsTransactions = allTransactions.filter(t => {
    const txDate = new Date(t.date);
    return t.category === 'risparmi' && txDate >= yearStart && txDate <= today;
  });

  // Sum all risparmi transactions (each transaction counts as income towards the goal)
  const yearSavingsTotal = yearSavingsTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  // Calculate improved savings metrics
  const dayOfYear = Math.floor((Date.now() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysInYear = 365;

  // Monthly average based on actual days elapsed
  const monthlyAverage = yearSavingsTotal / (dayOfYear / 30);

  // Projected yearly based on current pace
  const projectedYearly = (yearSavingsTotal / dayOfYear) * daysInYear;

  // Total to reach to hit the goal
  const savingsGoal = 15000;
  const totalToReach = Math.max(0, savingsGoal - yearSavingsTotal);

  // Monthly target needed to reach goal
  const monthsRemaining = Math.max(1, Math.ceil((daysInYear - dayOfYear) / 30));
  const monthlyTargetToReachGoal = totalToReach > 0 ? totalToReach / monthsRemaining : 0;

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthLabel = currentMonth.toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  return (
    <div className={reportsStyles.page.container} style={reportsStyles.page.style}>
      <div>
        {/* Header */}
        <header className={reportsStyles.header.container}>
          <div className={reportsStyles.header.inner}>
            <Button
              variant="ghost"
              size="sm"
              className={reportsStyles.header.button}
              onClick={handleBackClick}
            >
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <h1 className={reportsStyles.header.title}>Rapporti</h1>
            <div className={reportsStyles.header.spacer}></div>
          </div>
        </header>

        {/* User Selector */}
        <UserSelector
          users={users}
          currentUser={currentUser}
          selectedGroupFilter={selectedViewUserId}
          onGroupFilterChange={updateViewUserId}
        />

        {/* Month Selector - Under User Selector */}
        <div className="flex items-center justify-center gap-3 px-3 sm:px-4 py-3 border-b border-primary/10">
          <Button
            variant="ghost"
            size="sm"
            className={reportsStyles.header.button}
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-black capitalize min-w-[150px] text-center">
            {monthLabel}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className={reportsStyles.header.button}
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <main className={reportsStyles.main.container}>
          {/* Spending Overview */}
          <section>
            <SpendingOverviewCard
              income={totalIncome}
              expenses={totalExpenses}
              netSavings={netSavings}
              savingsRate={savingsRate}
            />
          </section>

          {/* Category Breakdown - First 5 */}
          <section>
            <div className={reportsStyles.sectionHeader.container}>
              <h2 className={reportsStyles.sectionHeader.title}>Spesa per categoria</h2>
              <p className={reportsStyles.sectionHeader.subtitle}>Top 5</p>
            </div>
            <CategoryBreakdownSection
              categories={categoryBreakdown.slice(0, 5)}
              isLoading={isLoading}
            />
          </section>

          {/* Savings Goal */}
          <section>
            <div className={reportsStyles.sectionHeader.container}>
              <h2 className={reportsStyles.sectionHeader.title}>Obiettivi di risparmio</h2>
              <p className={reportsStyles.sectionHeader.subtitle}>Progresso annuale</p>
            </div>
            <SavingsGoalCard
              currentSavings={yearSavingsTotal}
              savingsGoal={savingsGoal}
              projectedYearEnd={projectedYearly}
              projectedMonthly={monthlyAverage}
              monthlyTarget={monthlyTargetToReachGoal}
              totalToReach={totalToReach}
            />
          </section>
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
