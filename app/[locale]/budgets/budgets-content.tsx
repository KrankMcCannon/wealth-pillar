'use client';

/**
 * Budgets Content - Client Component
 *
 * Handles interactive budgets UI.
 * Admin can view and manage budgets for all group users.
 * Members can only view and manage their own budgets.
 * Data is passed from Server Component for optimal performance.
 */

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { BottomNavigation, PageContainer, Header } from '@/components/layout';
import UserSelector from '@/components/shared/user-selector';
import { UserSelectorSkeleton } from '@/features/dashboard';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { EmptyState } from '@/components/shared';
import {
  BudgetSelector,
  BudgetDisplayCard,
  BudgetProgress,
  BudgetChart,
  BudgetSelectorSkeleton,
  BudgetCardSkeleton,
  BudgetProgressSkeleton,
  BudgetChartSkeleton,
} from '@/features/budgets/components';
import { TransactionDayList, TransactionDayListSkeleton } from '@/features/transactions';
import { useBudgetsContent, type UseBudgetsContentProps } from '@/features/budgets';
import { budgetStyles } from '@/styles/system';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui';

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
  const t = useTranslations('Budgets.Page');
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
        title={t('title')}
        showBack={true}
        className={budgetStyles.header.container}
        currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
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
      <main className={`${budgetStyles.page.main} px-3 pb-24 pt-3 md:pb-8`}>
        {userBudgets.length > 0 && selectedBudget ? (
          <div className="space-y-4">
            <div className="space-y-4 lg:col-span-5">
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

                  <Suspense fallback={<BudgetChartSkeleton />}>
                    <BudgetChart
                      spent={selectedBudgetProgress.spent}
                      chartData={chartData}
                      periodInfo={
                        periodInfo
                          ? {
                              startDate: periodInfo.start || '',
                              endDate: periodInfo.end,
                            }
                          : null
                      }
                    />
                  </Suspense>
                </>
              )}
            </div>

            {selectedBudgetProgress && (
              <div className="space-y-4 lg:col-span-7">
                <Suspense fallback={<TransactionDayListSkeleton itemCount={3} showHeader />}>
                  <TransactionDayList
                    groupedTransactions={groupedTransactions}
                    accountNames={accountNamesMap}
                    categories={categories}
                    sectionTitle={t('transactions.sectionTitle')}
                    sectionSubtitle={transactionSectionSubtitle}
                    emptyTitle={t('transactions.emptyTitle')}
                    emptyDescription={t('transactions.emptyDescription')}
                    expensesOnly
                    showViewAll
                    viewAllLabel={t('transactions.viewAll')}
                    onViewAll={() => {
                      const params = new URLSearchParams();
                      params.set('from', 'budgets');
                      params.set('member', currentUser.id);
                      params.set('budget', selectedBudget.id);
                      params.set('category', selectedBudget.description);
                      if (periodInfo?.start) {
                        params.set('startDate', periodInfo.start);
                      }
                      if (periodInfo?.end) {
                        params.set('endDate', periodInfo.end);
                      }
                      router.push(`/transactions?${params.toString()}`);
                    }}
                    onEditTransaction={(transaction) => {
                      openModal('transaction', transaction.id);
                    }}
                    onDeleteTransaction={() => {
                      /* Handled via transaction form */
                    }}
                  />
                </Suspense>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={ShoppingCart}
            title={t('emptyState.title')}
            description={t('emptyState.description')}
            action={
              <Button onClick={handleCreateBudget} variant="default" size="sm">
                {t('emptyState.createButton')} →
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
        title={t('deleteDialog.title')}
        message={
          deleteConfirm.itemToDelete
            ? t('deleteDialog.message', { name: deleteConfirm.itemToDelete.description })
            : ''
        }
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('deleteDialog.cancel')}
        variant="destructive"
        onConfirm={confirmDeleteBudget}
        isLoading={deleteConfirm.isDeleting}
      />
    </PageContainer>
  );
}
