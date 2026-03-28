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

import { Suspense, use, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { useTransactionsContent, type UseTransactionsContentProps } from '@/features/transactions';
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
  const ONBOARDING_DISMISS_KEY = 'onboarding-transactions-v1-dismissed';
  const ONBOARDING_SYNC_EVENT = 'onboarding-transactions-sync';
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
  const isOnboardingDismissed = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {};
      const handleStorage = (e: StorageEvent) => {
        if (e.key === ONBOARDING_DISMISS_KEY) onStoreChange();
      };
      const handleLocalSync = () => onStoreChange();
      window.addEventListener('storage', handleStorage);
      window.addEventListener(ONBOARDING_SYNC_EVENT, handleLocalSync);
      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(ONBOARDING_SYNC_EVENT, handleLocalSync);
      };
    },
    () => {
      if (typeof window === 'undefined') return false;
      return window.localStorage.getItem(ONBOARDING_DISMISS_KEY) === 'true';
    },
    () => false
  );
  const showOnboardingHint = !isOnboardingDismissed;

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

  const handleDismissOnboardingHint = () => {
    window.localStorage.setItem(ONBOARDING_DISMISS_KEY, 'true');
    window.dispatchEvent(new Event(ONBOARDING_SYNC_EVENT));
  };

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
          {/* Transaction Filters */}
          {activeTab === 'Transactions' && (
            <section className={transactionStyles.layout.filtersBlock}>
              <div className={transactionStyles.layout.filtersInnerStack}>
                {showOnboardingHint && (
                  <aside className={transactionStyles.layout.onboardingAside}>
                    <div className={transactionStyles.layout.onboardingRow}>
                      <div className={transactionStyles.layout.onboardingContent}>
                        <p className={transactionStyles.layout.onboardingTitle}>
                          {t('onboarding.title')}
                        </p>
                        <ul className={transactionStyles.layout.onboardingList}>
                          <li>{t('onboarding.pointFilters')}</li>
                          <li>{t('onboarding.pointSwipe')}</li>
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
                <TransactionFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={categories}
                  budgetName={selectedBudget?.description}
                  onClearBudgetFilter={selectedBudget ? handleClearBudgetFilter : undefined}
                />
              </div>
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
                emptyTitle={t('empty.title')}
                emptyDescription={
                  selectedUserId ? t('empty.forUser') : t('empty.noTransactionsYet')
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
