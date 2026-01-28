"use client";

/**
 * Transactions Content - Client Component
 *
 * Handles interactive transactions UI with client-side state management
 * Data is passed from Server Component for optimal performance
 * 
 * Business logic extracted to useTransactionsContent hook for better
 * separation of concerns.
 */

import { Suspense } from "react";
import { useTransactionsContent, type UseTransactionsContentProps } from "@/features/transactions";
import { BottomNavigation, PageContainer, Header } from "@/components/layout";
import TabNavigation from "@/components/shared/tab-navigation";
import UserSelector from "@/components/shared/user-selector";
import { ConfirmationDialog } from "@/components/shared";
import { RecurringSeriesSection, PauseSeriesModal } from "@/features/recurring";
import { TransactionDayList, TransactionFilters } from "@/features/transactions";
import { transactionStyles } from "@/styles/system";
import { UserSelectorSkeleton } from "@/features/dashboard";
import { RecurringSeriesSkeleton } from "@/features/transactions/components/transaction-skeletons";

/**
 * Transactions Content Props (re-export from hook)
 */
type TransactionsContentProps = UseTransactionsContentProps;

/**
 * Transactions Content Component
 * Handles interactive transactions UI with state management
 */
export default function TransactionsContent(props: TransactionsContentProps) {
  const {
    currentUser,
    groupUsers,
    recurringSeries,
    categories,
  } = props;

  const {
    activeTab,
    setActiveTab,
    selectedUserId,
    filters,
    setFilters,
    selectedBudget,
    handleClearBudgetFilter,
    isLoadingMore,
    canLoadMore,
    sentinelRef,
    storeTransactions,
    dayTotals,
    accountNames,
    handleEditTransaction,
    handleDeleteClick,
    handleDeleteConfirm,
    deleteConfirm,
    recurringDeleteConfirm,
    handleRecurringDeleteClick,
    handleRecurringDeleteConfirm,
    showPauseModal,
    selectedSeriesForPause,
    handleRecurringPauseClick,
    handlePauseSuccess,
    handlePauseModalChange,
    openModal,
    router,
  } = useTransactionsContent(props);

  return (
    <PageContainer className={transactionStyles.page.container}>
      {/* Header */}
      <Header
        title="Transazioni"
        showBack={true}
        currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
        showActions={true}
      />

      {/* User Selector */}
      <Suspense fallback={<UserSelectorSkeleton />}>
        <UserSelector
          className={transactionStyles.userSelector.className}
          currentUser={currentUser}
          users={groupUsers}
        />
      </Suspense>

      {/* Tab Navigation */}
      <div className={transactionStyles.tabNavigation.wrapper}>
        <TabNavigation
          tabs={[
            { id: "Transactions", label: "Transazioni" },
            { id: "Recurrent", label: "Ricorrenti" },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="modern"
        />
      </div>

      {/* Main Content */}
      <main className={transactionStyles.page.main}>
        {/* Transaction Filters - Modern 2025 UX */}
        {activeTab === "Transactions" && (
          <TransactionFilters
            filters={filters}
            onFiltersChange={setFilters}
            categories={categories}
            budgetName={selectedBudget?.description}
            onClearBudgetFilter={selectedBudget ? handleClearBudgetFilter : undefined}
          />
        )}

        {/* Transactions Tab Content */}
        {activeTab === "Transactions" && (
          <>
            <TransactionDayList
              groupedTransactions={dayTotals}
              accountNames={accountNames}
              categories={categories}
              emptyTitle="Nessuna Transazione"
              emptyDescription={
                selectedUserId
                  ? "Non ci sono transazioni per questo utente"
                  : "Non ci sono ancora transazioni. Inizia aggiungendone una!"
              }
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteClick}
            />
            {/* Infinite scroll sentinel */}
            {canLoadMore && (
              <div ref={sentinelRef} className="flex justify-center py-4">
                {isLoadingMore && (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                )}
              </div>
            )}
            {!canLoadMore && storeTransactions.length > 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">
                Tutte le transazioni caricate ({storeTransactions.length})
              </p>
            )}
          </>
        )}

        {/* Recurring Tab Content */}
        {activeTab === "Recurrent" && (
          <Suspense fallback={<RecurringSeriesSkeleton />}>
            <RecurringSeriesSection
              series={recurringSeries}
              selectedUserId={selectedUserId ?? undefined}
              className={transactionStyles.recurringSection.container}
              showStats={true}
              maxItems={10}
              showActions={true}
              showDelete={true}
              onCreateRecurringSeries={() => openModal("recurring")}
              onEditRecurringSeries={(series) => openModal("recurring", series.id)}
              onDeleteRecurringSeries={handleRecurringDeleteClick}
              onPauseRecurringSeries={handleRecurringPauseClick}
              groupUsers={groupUsers}
              onSeriesUpdate={() => router.refresh()}
            />
          </Suspense>
        )}
      </main>

      <BottomNavigation />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={deleteConfirm.closeDialog}
        title="Elimina transazione"
        message={`Sei sicuro di voler eliminare la transazione "${deleteConfirm.itemToDelete?.description}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        cancelText="Annulla"
        variant="destructive"
        isLoading={deleteConfirm.isDeleting}
      />

      <ConfirmationDialog
        isOpen={recurringDeleteConfirm.isOpen}
        onConfirm={handleRecurringDeleteConfirm}
        onCancel={recurringDeleteConfirm.closeDialog}
        title="Elimina serie ricorrente"
        message={`Sei sicuro di voler eliminare la serie "${recurringDeleteConfirm.itemToDelete?.description}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        cancelText="Annulla"
        variant="destructive"
        isLoading={recurringDeleteConfirm.isDeleting}
      />

      <PauseSeriesModal
        isOpen={showPauseModal}
        onOpenChange={handlePauseModalChange}
        series={selectedSeriesForPause}
        onSuccess={handlePauseSuccess}
      />
    </PageContainer>
  );
}
