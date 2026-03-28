'use client';

/**
 * Transactions Content - Client Component
 *
 * Handles interactive transactions UI with client-side state management.
 * Data is passed from Server Component for optimal performance.
 *
 * Business logic extracted to useTransactionsContent hook for better
 * separation of concerns.
 */

import { Suspense, use, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useTransactionsContent, type UseTransactionsContentProps } from '@/features/transactions';
import { useOnboardingHint } from '@/features/transactions/hooks/useOnboardingHint';
import type { User } from '@/lib/types';
import type { TransactionsPageData } from '@/server/services/page-data.service';
import { BottomNavigation, PageContainer, Header } from '@/components/layout';
import TabNavigation from '@/components/shared/tab-navigation';
import UserSelector from '@/components/shared/user-selector';
import { ConfirmationDialog } from '@/components/shared';
import { RecurringSeriesSection, PauseSeriesModal } from '@/features/recurring';
import { TransactionFilters, TransactionTable } from '@/features/transactions';
import { transactionStyles } from '@/styles/system';
import { UserSelectorSkeleton } from '@/features/dashboard';
import { RecurringSeriesSkeleton } from '@/features/transactions/components/transaction-skeletons';

interface TransactionsContentProps {
  currentUser: User;
  groupUsers: User[];
  pageDataPromise: Promise<TransactionsPageData>;
}

/**
 * Transactions Content Component
 * Handles interactive transactions UI with state management
 */
export default function TransactionsContent({
  currentUser,
  groupUsers,
  pageDataPromise,
}: TransactionsContentProps) {
  const pageData = use(pageDataPromise);
  const {
    transactions = [],
    total = 0,
    hasMore = false,
    recurringSeries = [],
    budgets = [],
    accounts = [],
    categories = [],
  } = pageData;

  const props: UseTransactionsContentProps = {
    currentUser,
    groupUsers,
    transactions,
    totalTransactions: total,
    hasMoreTransactions: hasMore,
    recurringSeries,
    budgets,
    accounts,
    categories,
  };

  const t = useTranslations('TransactionsContent');
  const { showHint: showOnboardingHint, dismiss: handleDismissOnboardingHint } =
    useOnboardingHint();

  const {
    activeTab,
    setActiveTab,
    selectedUserId,
    filters,
    setFilters,
    selectedBudget,
    handleClearBudgetFilter,
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    isChangingPage,
    goToPage,
    currentPageItems,
    filteredCount,
    accountNames,
    handleEditTransaction,
    handleDeleteClick,
    handleDeleteConfirm,
    deleteConfirm,
    handleCancelDelete,
    recurringDeleteConfirm,
    handleRecurringCancelDelete,
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

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.searchQuery ||
          filters.type !== 'all' ||
          filters.dateRange !== 'all' ||
          filters.categoryKey !== 'all' ||
          (filters.categoryKeys && filters.categoryKeys.length > 0) ||
          filters.budgetId
      ),
    [filters]
  );

  const handleClearFilters = useCallback(() => {
    setFilters({ searchQuery: '', type: 'all', dateRange: 'all', categoryKey: 'all' });
    if (selectedBudget) handleClearBudgetFilter();
  }, [setFilters, selectedBudget, handleClearBudgetFilter]);

  const deleteTransactionDescription =
    deleteConfirm.itemToDelete?.description?.trim() ||
    t('dialogs.deleteTransaction.fallbackDescription');
  const deleteRecurringDescription =
    recurringDeleteConfirm.itemToDelete?.description?.trim() ||
    t('dialogs.deleteRecurring.fallbackDescription');

  return (
    <PageContainer className={transactionStyles.page.container}>
      {/* Header */}
      <Header
        title={t('headerTitle')}
        showBack
        currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
        showActions
      />

      <div className={transactionStyles.layout.controlsStack}>
        <div className={transactionStyles.layout.controlsCard}>
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
                { id: 'Transactions', label: t('tabs.transactions') },
                { id: 'Recurrent', label: t('tabs.recurrent') },
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="modern"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={transactionStyles.page.main}>
        <div className={transactionStyles.layout.contentStack}>
          {/* Onboarding hint — standalone card, not nested inside filters */}
          {activeTab === 'Transactions' && showOnboardingHint && (
            <aside className={transactionStyles.layout.onboardingAside}>
              <div className={transactionStyles.layout.onboardingRow}>
                <div className={transactionStyles.layout.onboardingContent}>
                  <p className={transactionStyles.layout.onboardingTitle}>
                    {t('onboarding.title')}
                  </p>
                  <ul className={transactionStyles.layout.onboardingList}>
                    <li>{t('onboarding.pointFilters')}</li>
                    <li>
                      {t('onboarding.pointSwipe')}
                      {/* Visual swipe demo — mobile only */}
                      <span
                        className="sm:hidden ml-2 inline-flex items-center gap-1 align-middle"
                        aria-hidden
                      >
                        <span className="relative inline-flex h-5 w-10 overflow-hidden rounded-sm bg-primary/10 align-middle">
                          <span className="absolute inset-y-0 left-0 w-3 rounded-sm bg-primary/20" />
                          <span className="animate-swipe-hint absolute top-1/2 -translate-y-1/2 text-[10px]">
                            👆
                          </span>
                        </span>
                      </span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={handleDismissOnboardingHint}
                  className={transactionStyles.layout.onboardingDismissButton}
                >
                  {t('onboarding.dismiss')}
                </button>
              </div>
            </aside>
          )}

          {/* Transaction Filters */}
          {activeTab === 'Transactions' && (
            <section className={transactionStyles.layout.filtersBlock}>
              <TransactionFilters
                filters={filters}
                onFiltersChange={setFilters}
                categories={categories}
                budgetName={selectedBudget?.description}
                onClearBudgetFilter={selectedBudget ? handleClearBudgetFilter : undefined}
              />
            </section>
          )}

          {/* Transactions Tab — paginated table */}
          {activeTab === 'Transactions' && (
            <section className={transactionStyles.layout.listBlock}>
              <TransactionTable
                transactions={currentPageItems}
                totalFilteredCount={filteredCount}
                accountNames={accountNames}
                categories={categories}
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                isChangingPage={isChangingPage}
                onPageChange={goToPage}
                onPageSizeChange={setPageSize}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteClick}
                {...(!hasActiveFilters && { onAddTransaction: () => openModal('transaction') })}
                {...(hasActiveFilters && { onClearFilters: handleClearFilters })}
                emptyTitle={t('empty.title')}
                emptyDescription={
                  hasActiveFilters
                    ? t('empty.noFilterResults')
                    : selectedUserId
                      ? t('empty.forUser')
                      : t('empty.noTransactionsYet')
                }
              />
            </section>
          )}
        </div>

        {/* Recurring Tab Content */}
        {activeTab === 'Recurrent' && (
          <Suspense fallback={<RecurringSeriesSkeleton />}>
            <RecurringSeriesSection
              series={recurringSeries}
              selectedUserId={selectedUserId ?? undefined}
              className={transactionStyles.recurringSection.container}
              showStats
              maxItems={10}
              showActions
              showDelete
              onCreateRecurringSeries={() => openModal('recurring')}
              onEditRecurringSeries={(series) => openModal('recurring', series.id)}
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
        onCancel={handleCancelDelete}
        title={t('dialogs.deleteTransaction.title')}
        message={t('dialogs.deleteTransaction.message', {
          description: deleteTransactionDescription,
        })}
        confirmText={t('dialogs.deleteTransaction.confirm')}
        cancelText={t('dialogs.cancel')}
        variant="destructive"
        isLoading={deleteConfirm.isDeleting}
      />

      <ConfirmationDialog
        isOpen={recurringDeleteConfirm.isOpen}
        onConfirm={handleRecurringDeleteConfirm}
        onCancel={handleRecurringCancelDelete}
        title={t('dialogs.deleteRecurring.title')}
        message={t('dialogs.deleteRecurring.message', {
          description: deleteRecurringDescription,
        })}
        confirmText={t('dialogs.deleteRecurring.confirm')}
        cancelText={t('dialogs.cancel')}
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
