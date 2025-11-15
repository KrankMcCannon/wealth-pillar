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
 * Data is passed from Server Component for optimal performance
 */

import { Suspense, useState } from "react";
import { Settings, Bell, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
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
import type { User } from "@/lib/types";

/**
 * Dashboard Content Props
 */
interface DashboardContentProps {
  currentUser: User;
  groupUsers: User[];
}

/**
 * Dashboard Content Component
 *
 * Handles full dashboard UI with four main sections
 * Receives data from Server Component parent
 */
export default function DashboardContent({ currentUser, groupUsers }: DashboardContentProps) {
  const router = useRouter();

  // State management for user filtering
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  // State management for recurring series modal
  const [isRecurringFormOpen, setIsRecurringFormOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<any>(undefined);
  const [formMode, setFormMode] = useState<'create' | 'edit' | undefined>(undefined);

  // Determine selected user ID (null for 'all', user ID otherwise)
  const selectedUserId = selectedGroupFilter === 'all' ? undefined : selectedGroupFilter;

  // Handler for group filter changes
  const handleGroupFilterChange = (userId: string) => {
    setSelectedGroupFilter(userId);
  };

  // Handler for account clicks
  const handleAccountClick = () => {
    router.push('/accounts');
  };

  // Handler for creating recurring series
  const handleCreateRecurringSeries = () => {
    setSelectedSeries(undefined);
    setFormMode('create');
    setIsRecurringFormOpen(true);
  };

  // Handler for editing recurring series
  const handleEditRecurringSeries = (series: any) => {
    setSelectedSeries(series);
    setFormMode('edit');
    setIsRecurringFormOpen(true);
  };

  // Handler for settings navigation
  const handleSettingsClick = () => {
    router.push('/settings');
  };
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
                  {currentUser.name}
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
              <Button variant="ghost" size="sm" className={dashboardStyles.header.button} onClick={handleSettingsClick}>
                <Settings className={dashboardStyles.header.section.settingsIcon} />
              </Button>
            </div>
          </div>
        </header>
      </Suspense>

      {/* User Selector */}
      <Suspense fallback={<UserSelectorSkeleton />}>
        <UserSelector
          users={groupUsers}
          currentUser={currentUser}
          selectedGroupFilter={selectedGroupFilter}
          onGroupFilterChange={handleGroupFilterChange}
          isLoading={false}
        />
      </Suspense>

      <main className={dashboardStyles.page.main}>
        {/* Balance Section */}
        <Suspense fallback={<BalanceSectionSkeleton />}>
          <BalanceSection
            accounts={[]}
            users={groupUsers}
            accountBalances={{}}
            totalBalance={0}
            onAccountClick={handleAccountClick}
            isLoading={false}
          />
        </Suspense>

        <div className={dashboardStyles.divider} />

        {/* Budget Section */}
        <div className="bg-[#F8FAFC]">
          <Suspense fallback={<BudgetSectionSkeleton />}>
            <BudgetSection
              budgetsByUser={{}}
              budgets={[]}
              selectedViewUserId={selectedUserId || currentUser.id}
              isLoading={false}
            />
          </Suspense>
        </div>

        {/* Recurring Series Section */}
        <Suspense fallback={<RecurringSeriesSkeleton />}>
          <RecurringSeriesSection
            selectedUserId={selectedUserId}
            className={dashboardStyles.recurringSection.container}
            showStats={false}
            maxItems={5}
            showActions={false}
            onCreateRecurringSeries={handleCreateRecurringSeries}
            onEditRecurringSeries={handleEditRecurringSeries}
          />
        </Suspense>
      </main>

      <BottomNavigation />

      {/* Recurring Series Form */}
      <Suspense fallback={null}>
        <RecurringSeriesForm
          isOpen={isRecurringFormOpen}
          onOpenChange={setIsRecurringFormOpen}
          selectedUserId={selectedUserId}
          series={selectedSeries}
          mode={formMode}
        />
      </Suspense>
    </div>
  );
}
