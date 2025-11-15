"use client";

/**
 * Budgets Content - Client Component
 *
 * Handles interactive budgets UI with client-side state management
 * Data is passed from Server Component for optimal performance
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavigation from "@/components/layout/bottom-navigation";
import UserSelector from "@/components/shared/user-selector";
import { BudgetForm } from "@/features/budgets";
import {
  BudgetHeader,
  BudgetSelector,
  BudgetDisplayCard,
  BudgetMetrics,
  BudgetProgress,
  BudgetChart,
  BudgetTransactionsList,
  BudgetEmptyState,
  BudgetSelectorSkeleton,
  BudgetCardSkeleton,
  BudgetMetricsSkeleton,
  BudgetProgressSkeleton,
  BudgetChartSkeleton,
  BudgetTransactionsListSkeleton,
} from "@/features/budgets/components";
import { CategoryForm } from "@/features/categories";
import { TransactionForm } from "@/features/transactions";
import { Suspense } from "react";
import { budgetStyles } from "@/features/budgets/theme/budget-styles";
import type { DashboardDataProps } from "@/lib/auth/get-dashboard-data";

/**
 * Budgets Content Component
 * Receives user data from Server Component parent
 */
export default function BudgetsContent({ currentUser, groupUsers }: DashboardDataProps) {
  const router = useRouter();

  // State management
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  return (
    <div className={budgetStyles.page.container}>
      {/* Header with navigation and actions */}
      <BudgetHeader
        isDropdownOpen={isDropdownOpen}
        onOpenChange={setIsDropdownOpen}
        onBackClick={() => router.back()}
        onCreateBudget={() => {}}
        onCreateCategory={() => {}}
        selectedBudget={null}
        currentPeriod={null}
        onPeriodManagerSuccess={() => setIsDropdownOpen(false)}
        // periodManagerComponent={
        // state.selectedBudget && currentPeriod ? (
        //   <BudgetPeriodManager
        //     budget={state.selectedBudget}
        //     currentPeriod={currentPeriod}
        //     onSuccess={() => actions.setIsDropdownOpen(false)}
        //     trigger={
        //       <DropdownMenuItem
        //         className={budgetStyles.dropdownMenu.item}
        //         onSelect={(e) => e.preventDefault()}
        //       >
        //         <span className="mr-2">📅</span>{' '}
        //         Gestisci Periodi
        //       </DropdownMenuItem>
        //     }
        //   />
        // ) : undefined
        // }
      />

      {/* User Selector */}
      <UserSelector
        users={groupUsers}
        currentUser={currentUser}
        selectedGroupFilter={selectedGroupFilter}
        onGroupFilterChange={setSelectedGroupFilter}
      />

      {/* Main content area with progressive loading */}
      <main className={budgetStyles.page.main}>
        {false ? (
          <>
            {/* Budget selector with fallback skeleton */}
            <Suspense fallback={<BudgetSelectorSkeleton />}>
              <BudgetSelector
                selectedBudget={null}
                availableBudgets={[]}
                userNamesMap={{}}
                selectedViewUserId={""}
                onBudgetSelect={() => {}}
              />
            </Suspense>

            {/* Budget display card with period info */}
            <Suspense fallback={<BudgetCardSkeleton />}>
              <BudgetDisplayCard budget={null} period={null} onEdit={() => {}} />
            </Suspense>

            {/* Financial metrics display */}
            <Suspense fallback={<BudgetMetricsSkeleton />}>
              <BudgetMetrics viewModel={null} budgetAmount={0} />
            </Suspense>

            {/* Progressive sections loaded with viewModel */}
            {false && (
              <>
                {/* Progress indicator */}
                <Suspense fallback={<BudgetProgressSkeleton />}>
                  <BudgetProgress progressData={null} />
                </Suspense>

                {/* Expense trend chart */}
                <Suspense fallback={<BudgetChartSkeleton />}>
                  <BudgetChart spent={0} chartData={null} periodComparison={null} periodInfo={null} />
                </Suspense>

                {/* Grouped transactions list */}
                <Suspense fallback={<BudgetTransactionsListSkeleton />}>
                  <BudgetTransactionsList
                    groupedTransactions={[]}
                    accountNames={{}}
                    transactionCount={0}
                    selectedBudget={null}
                    selectedViewUserId={""}
                    periodInfo={null}
                    onEditTransaction={() => {}}
                    onDeleteTransaction={() => {
                      /* Handled via transaction form */
                    }}
                    onViewAll={() => {
                      // const params = new URLSearchParams();
                      // params.set('from', 'budgets');
                      // if (selectedViewUserId !== 'all') {
                      //   params.set('member', selectedViewUserId);
                      // }
                      // params.set('budget', state.selectedBudget!.id);
                      // params.set('category', state.selectedBudget!.description);
                      // globalThis.location.href = `/transactions?${params.toString()}`;
                    }}
                  />
                </Suspense>
              </>
            )}
          </>
        ) : (
          (() => {
            // Empty state when no budget selected
            // const isLoadingEmptyBudgets = data.budgets.isLoading && (!data.budgets.data || data.budgets.data.length === 0);

            // if (isLoadingEmptyBudgets) {
            //   return <BudgetSelectorSkeleton />;
            // }

            return <BudgetEmptyState onCreateBudget={() => {}} />;
          })()
        )}
      </main>

      <BottomNavigation />

      {/* Modal Forms */}
      <TransactionForm
        isOpen={false}
        onOpenChange={() => {}}
        selectedUserId={undefined}
        transaction={undefined}
        mode={undefined}
      />

      <BudgetForm
        isOpen={false}
        onOpenChange={() => {}}
        selectedUserId={undefined}
        budget={undefined}
        mode={undefined}
      />

      <CategoryForm isOpen={false} onOpenChange={() => {}} mode="create" />
    </div>
  );
}
