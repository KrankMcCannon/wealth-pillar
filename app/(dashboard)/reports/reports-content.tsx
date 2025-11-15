"use client";

import React from "react";
import BottomNavigation from "@/src/components/layout/bottom-navigation";
import { PageLoader } from "@/src/components/shared";
import UserSelector from "@/src/components/shared/user-selector";
import { SpendingOverviewCard, CategoryBreakdownSection, SavingsGoalCard, reportsStyles } from "@/features/reports";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui";

export default function ReportsPage() {
  // Show loader while data is loading
  if (false) {
    return <PageLoader message="Caricamento report..." />;
  }

  if (!true) {
    return <PageLoader message="Nessun dato disponibile..." />;
  }

  return (
    <div className={reportsStyles.page.container} style={reportsStyles.page.style}>
      <div>
        {/* Header */}
        <header className={reportsStyles.header.container}>
          <div className={reportsStyles.header.inner}>
            <Button variant="ghost" size="sm" className={reportsStyles.header.button} onClick={() => {}}>
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <h1 className={reportsStyles.header.title}>Rapporti</h1>
            <div className={reportsStyles.header.spacer}></div>
          </div>
        </header>

        {/* User Selector */}
        <UserSelector users={[]} currentUser={null} selectedGroupFilter={""} onGroupFilterChange={() => {}} />

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
            <SpendingOverviewCard income={0} expenses={0} netSavings={0} savingsRate={0} />
          </section>

          {/* Category Breakdown - First 5 */}
          <section>
            <div className={reportsStyles.sectionHeader.container}>
              <h2 className={reportsStyles.sectionHeader.title}>Spesa per categoria</h2>
              <p className={reportsStyles.sectionHeader.subtitle}>Top 5</p>
            </div>
            <CategoryBreakdownSection categories={[]} isLoading={false} />
          </section>

          {/* Savings Goal */}
          <section>
            <div className={reportsStyles.sectionHeader.container}>
              <h2 className={reportsStyles.sectionHeader.title}>Obiettivi di risparmio</h2>
              <p className={reportsStyles.sectionHeader.subtitle}>Progresso annuale</p>
            </div>
            <SavingsGoalCard
              currentSavings={0}
              savingsGoal={0}
              projectedYearEnd={0}
              projectedMonthly={0}
              monthlyTarget={0}
              totalToReach={0}
            />
          </section>
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
