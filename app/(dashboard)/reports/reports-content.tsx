"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import BottomNavigation from "@/src/components/layout/bottom-navigation";
import UserSelector from "@/src/components/shared/user-selector";
import { SpendingOverviewCard, CategoryBreakdownSection, SavingsGoalCard, reportsStyles } from "@/features/reports";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui";
import type { DashboardDataProps } from "@/lib/auth/get-dashboard-data";
import type { Transaction, ReportMetrics } from "@/lib/types";
import { TransactionService } from "@/lib/services";

interface ReportsContentProps extends DashboardDataProps {
  transactions: Transaction[];
  initialMetrics: ReportMetrics;
}

export default function ReportsContent({
  currentUser,
  groupUsers,
  transactions,
  initialMetrics,
}: ReportsContentProps) {
  const router = useRouter();
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  // Recalculate metrics when user filter changes using service layer
  const metrics = useMemo(() => {
    if (selectedGroupFilter === 'all') {
      return initialMetrics;
    }
    // Use TransactionService for business logic
    return TransactionService.calculateReportMetrics(
      transactions,
      selectedGroupFilter
    );
  }, [selectedGroupFilter, transactions, initialMetrics]);

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

        {/* Month Selector - Under User Selector */}
        <div className="flex items-center justify-center gap-3 px-3 sm:px-4 py-3 border-b border-primary/10">
          <Button variant="ghost" size="sm" className={reportsStyles.header.button} onClick={() => {}}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-black capitalize min-w-[150px] text-center">{""}</span>
          <Button variant="ghost" size="sm" className={reportsStyles.header.button} onClick={() => {}}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <main className={reportsStyles.main.container}>
          {/* Spending Overview */}
          <section>
            <SpendingOverviewCard
              income={metrics.income}
              expenses={metrics.expenses}
              netSavings={metrics.netSavings}
              savingsRate={metrics.savingsRate}
            />
          </section>

          {/* Category Breakdown - First 5 */}
          <section>
            <div className={reportsStyles.sectionHeader.container}>
              <h2 className={reportsStyles.sectionHeader.title}>Spesa per categoria</h2>
              <p className={reportsStyles.sectionHeader.subtitle}>Top 5</p>
            </div>
            <CategoryBreakdownSection categories={metrics.categories as any} isLoading={false} />
          </section>

          {/* Savings Goal */}
          <section>
            <div className={reportsStyles.sectionHeader.container}>
              <h2 className={reportsStyles.sectionHeader.title}>Obiettivi di risparmio</h2>
              <p className={reportsStyles.sectionHeader.subtitle}>Progresso annuale</p>
            </div>
            <SavingsGoalCard
              currentSavings={metrics.netSavings}
              savingsGoal={10000}
              projectedYearEnd={metrics.netSavings * 12}
              projectedMonthly={metrics.netSavings}
              monthlyTarget={833}
              totalToReach={Math.max(0, 10000 - metrics.netSavings)}
            />
          </section>
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
