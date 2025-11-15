"use client";

/**
 * Dashboard Content - Client Component
 *
 * Complete dashboard UI with all sections:
 * - Header with profile and settings
 * - User Selector for multi-user filtering
 * - Balance Section (accounts and total balance)
 * - Budget Section (budgets grouped by user)
 * - Recurring Series Section (upcoming recurring transactions)
 * - Recurring Series Form Modal
 *
 * All data fetching happens in parallel via React Query hooks
 */

import { Suspense } from "react";
import { Settings, Bell, AlertTriangle } from "lucide-react";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { QueryErrorFallback } from "@/components/shared";
import { Button, IconContainer, Text } from "@/components/ui";
import {
  BalanceSectionSkeleton,
  BudgetSectionSkeleton,
  DashboardHeaderSkeleton,
  RecurringSeriesSkeleton,
  UserSelectorSkeleton,
  dashboardStyles,
} from "@/features/dashboard";
import UserSelector from "@/components/shared/user-selector";
import { BalanceSection } from "@/features/accounts";
import { BudgetSection } from "@/features/budgets";
import { RecurringSeriesForm, RecurringSeriesSection } from "@/features/recurring";

/**
 * Dashboard Content Component
 *
 * Handles full dashboard UI with four main sections
 * Uses client-side data fetching with parallel query execution
 */
export default function DashboardContent() {
  // Critical error handling (blocks entire dashboard)
  if (false) {
    return (
      <div className={dashboardStyles.page.container}>
        <header className="sticky top-0 z-20 bg-card/70 backdrop-blur-xl border-b border-primary/20 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <IconContainer size="md" color="destructive" className="rounded-xl sm:rounded-2xl">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
              </IconContainer>
              <div className="flex flex-col">
                <Text variant="heading" size="sm" className="sm:text-base text-destructive">
                  Errore di Connessione
                </Text>
                <Text variant="emphasis" size="xs" className="sm:text-sm text-destructive">
                  Dati non disponibili
                </Text>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <QueryErrorFallback
            error={null}
            reset={() => globalThis.location.reload()}
            title="Errore nel caricamento della dashboard"
            description="Si è verificato un errore durante il caricamento dei dati finanziari. Verifica la connessione internet e riprova."
          />
        </main>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <div
      className={dashboardStyles.page.container}
      style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}
    >
      {/* Mobile-First Header */}
      <Suspense fallback={<DashboardHeaderSkeleton />}>
        <header className={dashboardStyles.header.container}>
          <div className={dashboardStyles.header.inner}>
            {/* Left - User Profile */}
            <div className={dashboardStyles.header.section.left}>
              <IconContainer size="sm" color="primary" className={dashboardStyles.header.section.profileIcon}>
                <Settings className="h-4 w-4" />
              </IconContainer>
              <div className={dashboardStyles.header.section.profileName}>
                <Text variant="heading" size="sm">
                  {"Utente"}
                </Text>
                <Text variant="muted" size="xs" className="font-semibold">
                  Premium Plan
                </Text>
              </div>
            </div>

            {/* Right - Actions */}
            <div className={dashboardStyles.header.section.right}>
              <Button variant="ghost" size="sm" className={dashboardStyles.header.button}>
                <Bell className={dashboardStyles.header.section.notificationIcon} />
              </Button>
              <Button variant="ghost" size="sm" className={dashboardStyles.header.button} onClick={() => {}}>
                <Settings className={dashboardStyles.header.section.settingsIcon} />
              </Button>
            </div>
          </div>
        </header>
      </Suspense>

      {/* User Selector */}
      <Suspense fallback={<UserSelectorSkeleton />}>
        <UserSelector
          users={[]}
          currentUser={null}
          selectedGroupFilter={""}
          onGroupFilterChange={() => {}}
          isLoading={false}
        />
      </Suspense>

      <main className={dashboardStyles.page.main}>
        {/* Balance Section */}
        <Suspense fallback={<BalanceSectionSkeleton />}>
          <BalanceSection
            accounts={[]}
            users={[]}
            accountBalances={{}}
            totalBalance={0}
            onAccountClick={() => {}}
            isLoading={false}
          />
        </Suspense>

        <div className={dashboardStyles.divider} />

        {/* Budget Section */}
        <div className="bg-[#F8FAFC]">
          <Suspense fallback={<BudgetSectionSkeleton />}>
            <BudgetSection budgetsByUser={{}} budgets={[]} selectedViewUserId={""} isLoading={false} />
          </Suspense>
        </div>

        {/* Recurring Series Section */}
        <Suspense fallback={<RecurringSeriesSkeleton />}>
          <RecurringSeriesSection
            selectedUserId={undefined}
            className={dashboardStyles.recurringSection.container}
            showStats={false}
            maxItems={5}
            showActions={false}
            onCreateRecurringSeries={() => {}}
            onEditRecurringSeries={() => {}}
          />
        </Suspense>
      </main>

      <BottomNavigation />

      {/* Recurring Series Form */}
      <Suspense fallback={null}>
        <RecurringSeriesForm
          isOpen={false}
          onOpenChange={() => {}}
          selectedUserId={undefined}
          series={undefined}
          mode={undefined}
        />
      </Suspense>
    </div>
  );
}
