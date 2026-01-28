"use client";

/**
 * Budgets Content - Client Component
 *
 * Handles interactive budgets UI.
 * Admin can view and manage budgets for all group users.
 * Members can only view and manage their own budgets.
 * Data is passed from Server Component for optimal performance.
 */

import { Suspense } from "react";
import { BottomNavigation, PageContainer, Header } from "@/components/layout";
import UserSelector from "@/components/shared/user-selector";
import { UserSelectorSkeleton } from "@/features/dashboard";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared";
import {
  BudgetSelector,
  BudgetDisplayCard,
  BudgetProgress,
  BudgetChart,
  BudgetSelectorSkeleton,
  BudgetCardSkeleton,
  BudgetProgressSkeleton,
  BudgetChartSkeleton,
} from "@/features/budgets/components";
import {
  TransactionDayList,
  TransactionDayListSkeleton,
} from "@/features/transactions";
import { useBudgetsContent, type UseBudgetsContentProps } from "@/features/budgets";
import { budgetStyles } from "@/styles/system";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * Budgets Content Props
 */
type BudgetsContentProps = UseBudgetsContentProps;

/**
 * Budgets Content Component
 * Admin can view and manage budgets for all group users.
 * Members can only view and manage their own budgets.
 * Receives user data from Server Component parent.
 */
export default function BudgetsContent(props: BudgetsContentProps) {
  const {
    router,
    currentUser,
    groupUsers,
    selectedBudget,
    selectedBudgetProgress,
    userBudgets,
    periodInfo,
    groupedTransactions,
    chartData,
    transactionSectionSubtitle,
    accountNamesMap,
    categories,
    handleBudgetSelect,
    handleCreateBudget,
    handleEditBudget,
    handleDeleteBudget,
    confirmDeleteBudget,
    deleteConfirm,
    openModal,
  } = useBudgetsContent(props);

  return (
    <PageContainer className={budgetStyles.page.container}>
      {/* Header with navigation and actions */}
      <Header
        title="Budgets"
        showBack={true}
        className={budgetStyles.header.container}
        currentUser={{ name: currentUser.name, role: currentUser.role || "member" }}
        showActions={true}
      />

      {/* User Selector */}
      <Suspense fallback={<UserSelectorSkeleton />}>
        <UserSelector
          className={budgetStyles.userSelector.className}
          currentUser={currentUser}
          users={groupUsers}
        />
      </Suspense>

      {/* Main content area with progressive loading */}
      <main className={budgetStyles.page.main}>
        {userBudgets.length > 0 && selectedBudget ? (
          <>
            {/* Budget selector with fallback skeleton */}
            <Suspense fallback={<BudgetSelectorSkeleton />}>
              <BudgetSelector
                selectedBudget={selectedBudget}
                availableBudgets={userBudgets}
                users={groupUsers}
                onBudgetSelect={handleBudgetSelect}
              />
            </Suspense>

            {/* Budget display card with period info and metrics */}
            <Suspense fallback={<BudgetCardSkeleton />}>
              <BudgetDisplayCard
                budget={selectedBudget}
                period={periodInfo?.activePeriod || null}
                budgetProgress={
                  selectedBudgetProgress
                    ? {
                      spent: selectedBudgetProgress.spent,
                      remaining: selectedBudgetProgress.remaining,
                      percentage: selectedBudgetProgress.percentage,
                      amount: selectedBudgetProgress.amount,
                    }
                    : null
                }
                onEdit={handleEditBudget}
                onDelete={handleDeleteBudget}
              />
            </Suspense>

            {/* Progressive sections loaded with budget progress */}
            {selectedBudgetProgress && (
              <>
                {/* Progress indicator */}
                <Suspense fallback={<BudgetProgressSkeleton />}>
                  <BudgetProgress
                    progressData={{
                      percentage: selectedBudgetProgress.percentage,
                      spent: selectedBudgetProgress.spent,
                      remaining: selectedBudgetProgress.remaining,
                      amount: selectedBudgetProgress.amount,
                    }}
                  />
                </Suspense>

                {/* Expense trend chart */}
                <Suspense fallback={<BudgetChartSkeleton />}>
                  <BudgetChart
                    spent={selectedBudgetProgress.spent}
                    chartData={chartData}
                    periodInfo={
                      periodInfo
                        ? {
                          startDate: periodInfo.start || "",
                          endDate: periodInfo.end,
                        }
                        : null
                    }
                  />
                </Suspense>

                {/* Grouped transactions list */}
                <Suspense fallback={<TransactionDayListSkeleton itemCount={3} showHeader />}>
                  <TransactionDayList
                    groupedTransactions={groupedTransactions}
                    accountNames={accountNamesMap}
                    categories={categories}
                    sectionTitle="Transazioni Budget"
                    sectionSubtitle={transactionSectionSubtitle}
                    emptyTitle="Nessuna Transazione"
                    emptyDescription="Nessuna transazione trovata per questo budget"
                    expensesOnly
                    showViewAll
                    viewAllLabel="Vedi tutte"
                    onViewAll={() => {
                      const params = new URLSearchParams();
                      params.set("from", "budgets");
                      params.set("member", currentUser.id);
                      params.set("budget", selectedBudget.id);
                      params.set("category", selectedBudget.description);
                      if (periodInfo?.start) {
                        params.set("startDate", periodInfo.start);
                      }
                      if (periodInfo?.end) {
                        params.set("endDate", periodInfo.end);
                      }
                      router.push(`/transactions?${params.toString()}`);
                    }}
                    onEditTransaction={(transaction) => {
                      openModal("transaction", transaction.id);
                    }}
                    onDeleteTransaction={() => {
                      /* Handled via transaction form */
                    }}
                  />
                </Suspense>
              </>
            )}
          </>
        ) : (
          <EmptyState
            icon={ShoppingCart}
            title="Nessun budget disponibile"
            description="Crea il tuo primo budget per iniziare"
            action={
              <Button onClick={handleCreateBudget} variant="default" size="sm">
                Crea budget →
              </Button>
            }
          />
        )}
      </main>

      <BottomNavigation />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onCancel={deleteConfirm.closeDialog}
        title="Elimina Budget"
        message={
          deleteConfirm.itemToDelete
            ? `Sei sicuro di voler eliminare il budget "${deleteConfirm.itemToDelete.description}"? Questa azione non può essere annullata.`
            : ""
        }
        confirmText="Elimina"
        cancelText="Annulla"
        variant="destructive"
        onConfirm={confirmDeleteBudget}
        isLoading={deleteConfirm.isDeleting}
      />
    </PageContainer>
  );
}
