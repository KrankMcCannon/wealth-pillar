/**
 * Budgets Page
 * Refactored to use extracted components and consolidated hooks
 * Reduced from 594 lines to ~180 lines with improved readability
 * Implements progressive loading with Suspense boundaries and mobile-friendly skeleton screens
 */

'use client';

import BottomNavigation from '@/components/layout/bottom-navigation';
import UserSelector from '@/components/shared/user-selector';
import { BudgetForm, BudgetPeriodManager } from '@/features/budgets';
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
} from '@/features/budgets/components';
import { useBudgetsData, isSectionReady } from '@/features/budgets/hooks/useBudgetsData';
import { useBudgetsState } from '@/features/budgets/hooks/useBudgetsState';
import {
  filterBudgetsForUser,
  getUserActivePeriod,
  createBudgetDisplayModel,
} from '@/features/budgets/services/budgets.service';
import { CategoryForm } from '@/features/categories';
import { TransactionForm } from '@/features/transactions';
import { DropdownMenuItem } from '@/components/ui';
import { Suspense, useMemo } from 'react';
import { budgetStyles } from '@/features/budgets/theme/budget-styles';
import { useUserSelection } from '@/lib/hooks/use-user-selection';
import { UserSelectorSkeleton } from '@/features/dashboard';

function BudgetsContent() {
  // Load all data with progressive loading states
  const data = useBudgetsData();

  // Manage page state (selection, forms, modals)
  const { state, actions } = useBudgetsState();

  // Get current user and selected view user from auth/selection hook
  const { currentUser, selectedViewUserId, updateViewUserId } = useUserSelection();

  const availableBudgets = useMemo(
    () =>
      filterBudgetsForUser(
        data.budgets.data,
        selectedViewUserId,
        currentUser,
        data.users.data
      ),
    [data.budgets.data, selectedViewUserId, currentUser, data.users.data]
  );

  // Get active period for selected budget
  const currentPeriod = useMemo(
    () =>
      state.selectedBudget
        ? getUserActivePeriod(state.selectedBudget.user_id, data.periods.data)
        : null,
    [state.selectedBudget, data.periods.data]
  );

  // Create view model for display
  const viewModel = useMemo(
    () =>
      state.selectedBudget
        ? createBudgetDisplayModel(state.selectedBudget, data.transactions.data, currentPeriod)
        : null,
    [state.selectedBudget, data.transactions.data, currentPeriod]
  );

  return (
    <div className={budgetStyles.page.container}>
      {/* Header with navigation and actions */}
      <BudgetHeader
        isDropdownOpen={state.isDropdownOpen}
        onOpenChange={actions.setIsDropdownOpen}
        onBackClick={actions.handleBackClick}
        onCreateBudget={actions.handleCreateBudget}
        onCreateCategory={actions.handleCreateCategory}
        selectedBudget={state.selectedBudget}
        currentPeriod={currentPeriod}
        onPeriodManagerSuccess={() => actions.setIsDropdownOpen(false)}
        periodManagerComponent={
          state.selectedBudget && currentPeriod ? (
            <BudgetPeriodManager
              budget={state.selectedBudget}
              currentPeriod={currentPeriod}
              onSuccess={() => actions.setIsDropdownOpen(false)}
              trigger={
                <DropdownMenuItem
                  className={budgetStyles.dropdownMenu.item}
                  onSelect={(e) => e.preventDefault()}
                >
                  <span className="mr-2">📅</span>
                  Gestisci Periodi
                </DropdownMenuItem>
              }
            />
          ) : undefined
        }
      />

      {/* User Selector */}
      <Suspense fallback={<UserSelectorSkeleton />}>
        <UserSelector
          users={data.users.data as any}
          currentUser={currentUser}
          selectedGroupFilter={selectedViewUserId}
          onGroupFilterChange={updateViewUserId}
        />
      </Suspense>

      {/* Main content area with progressive loading */}
      <main className={budgetStyles.page.main}>
        {!state.selectedBudget ? (
          // Empty state when no budget selected
          isSectionReady(data.budgets, 0) ? (
            <BudgetEmptyState onCreateBudget={actions.handleCreateBudget} />
          ) : (
            <BudgetSelectorSkeleton />
          )
        ) : (
          <>
            {/* Budget selector with fallback skeleton */}
            <Suspense fallback={<BudgetSelectorSkeleton />}>
              <BudgetSelector
                selectedBudget={state.selectedBudget}
                availableBudgets={availableBudgets}
                userNamesMap={data.userNamesMap}
                selectedViewUserId={selectedViewUserId}
                onBudgetSelect={actions.handleBudgetSelect}
              />
            </Suspense>

            {/* Budget display card with period info */}
            <Suspense fallback={<BudgetCardSkeleton />}>
              <BudgetDisplayCard
                budget={state.selectedBudget}
                period={currentPeriod}
                onEdit={actions.handleEditBudget}
                onDelete={actions.handleDeleteBudget}
              />
            </Suspense>

            {/* Financial metrics display */}
            <Suspense fallback={<BudgetMetricsSkeleton />}>
              <BudgetMetrics
                viewModel={viewModel}
                budgetAmount={state.selectedBudget?.amount || 0}
              />
            </Suspense>

            {/* Progressive sections loaded with viewModel */}
            {viewModel && (
              <>
                {/* Progress indicator */}
                <Suspense fallback={<BudgetProgressSkeleton />}>
                  <BudgetProgress progressData={viewModel.progressData} />
                </Suspense>

                {/* Expense trend chart */}
                <Suspense fallback={<BudgetChartSkeleton />}>
                  <BudgetChart
                    spent={viewModel.financialMetrics.totalSpent}
                    chartData={viewModel.chartData}
                    periodComparison={viewModel.periodComparison}
                    periodInfo={viewModel.periodInfo}
                  />
                </Suspense>

                {/* Grouped transactions list */}
                <Suspense fallback={<BudgetTransactionsListSkeleton />}>
                  <BudgetTransactionsList
                    groupedTransactions={viewModel.groupedTransactions}
                    accountNames={data.accountNamesMap}
                    transactionCount={viewModel.transactionCount}
                    selectedBudget={state.selectedBudget}
                    selectedViewUserId={state.selectedViewUserId}
                    periodInfo={viewModel.periodInfo}
                    onEditTransaction={actions.handleEditTransaction}
                    onDeleteTransaction={() => {
                      /* Handled via transaction form */
                    }}
                    onViewAll={() => {
                      const params = new URLSearchParams();
                      params.set('from', 'budgets');
                      if (selectedViewUserId !== 'all') {
                        params.set('member', selectedViewUserId);
                      }
                      params.set('budget', state.selectedBudget!.id);
                      params.set('category', state.selectedBudget!.description);
                      window.location.href = `/transactions?${params.toString()}`;
                    }}
                  />
                </Suspense>
              </>
            )}
          </>
        )}
      </main>

      <BottomNavigation />

      {/* Modal Forms */}
      <TransactionForm
        isOpen={state.isTransactionFormOpen}
        onOpenChange={actions.setIsTransactionFormOpen}
        selectedUserId={selectedViewUserId !== 'all' ? selectedViewUserId : ''}
        transaction={state.editingTransaction || undefined}
        mode={state.transactionFormMode}
      />

      <BudgetForm
        isOpen={state.isBudgetFormOpen}
        onOpenChange={actions.setIsBudgetFormOpen}
        selectedUserId={selectedViewUserId !== 'all' ? selectedViewUserId : undefined}
        budget={state.editingBudget || undefined}
        mode={state.budgetFormMode}
      />

      <CategoryForm
        isOpen={state.isCategoryFormOpen}
        onOpenChange={actions.setIsCategoryFormOpen}
        mode="create"
      />
    </div>
  );
}

export default function BudgetsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Caricamento...</div>}>
      <BudgetsContent />
    </Suspense>
  );
}
