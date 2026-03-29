'use client';

/**
 * Budgets Content - Client Component
 *
 * Handles interactive budgets UI.
 * Admin can view and manage budgets for all group users.
 * Members can only view and manage their own budgets.
 * Data is passed from Server Component for optimal performance.
 */

import { useTranslations } from 'next-intl';
import { BottomNavigation, PageContainer, Header, SectionHeader } from '@/components/layout';
import { PageSection } from '@/components/ui/layout';
import UserSelector from '@/components/shared/user-selector';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { EmptyState } from '@/components/shared';
import {
  BudgetSelector,
  BudgetDisplayCard,
  BudgetProgress,
  BudgetChart,
} from '@/features/budgets/components';
import { TransactionDayList } from '@/features/transactions';
import { useBudgetsContent, type UseBudgetsContentProps } from '@/features/budgets';
import type { User, UserBudgetSummary } from '@/lib/types';
import type { BudgetsPageData } from '@/server/services/page-data.service';
import { budgetStyles, reportsStyles } from '@/styles/system';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui';

type BudgetsPagePayload = BudgetsPageData & {
  budgetsByUser: Record<string, UserBudgetSummary>;
};

interface BudgetsContentProps {
  currentUser: User;
  groupUsers: User[];
  pageData: BudgetsPagePayload;
}

/**
 * Budgets Content Component
 * Admin can view and manage budgets for all group users.
 * Members can only view and manage their own budgets.
 * Receives user data from Server Component parent.
 */
export default function BudgetsContent({ currentUser, groupUsers, pageData }: BudgetsContentProps) {
  const {
    budgets = [],
    transactions = [],
    accounts = [],
    categories = [],
    budgetPeriods = {},
    budgetsByUser = {},
  } = pageData;

  const props: UseBudgetsContentProps = {
    categories: categories || [],
    budgets: budgets || [],
    transactions: transactions || [],
    accounts: accounts || [],
    budgetPeriods,
    currentUser,
    groupUsers,
    precalculatedData: budgetsByUser,
  };

  const t = useTranslations('Budgets.Page');
  const {
    router,
    selectedBudget,
    selectedBudgetProgress,
    userBudgets,
    periodInfo,
    groupedTransactions,
    chartData,
    transactionSectionSubtitle,
    accountNamesMap,
    categories: hookCategories,
    handleBudgetSelect,
    handleCreateBudget,
    handleEditBudget,
    handleDeleteBudget,
    confirmDeleteBudget,
    deleteConfirm,
    handleCancelDelete,
    openModal,
  } = useBudgetsContent(props);

  return (
    <PageContainer>
      <Header
        title={t('title')}
        showBack
        currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
        showActions
      />

      <main className={reportsStyles.main.container}>
        <section
          aria-labelledby="budgets-section-context"
          className={reportsStyles.section.surface}
        >
          <PageSection className="space-y-3 sm:space-y-4">
            <SectionHeader
              titleId="budgets-section-context"
              title={t('sectionContextTitle')}
              subtitle={t('sectionContextSubtitle')}
            />
            <UserSelector
              hideTitle
              className={budgetStyles.userSelector.className}
              currentUser={currentUser}
              users={groupUsers}
            />
          </PageSection>
        </section>

        {userBudgets.length > 0 && selectedBudget ? (
          <section
            aria-labelledby="budgets-section-details"
            className={`mt-5 sm:mt-6 ${reportsStyles.section.surface}`}
          >
            <PageSection className="space-y-4 sm:space-y-6">
              <SectionHeader
                titleId="budgets-section-details"
                title={t('sectionDetailsTitle')}
                subtitle={t('sectionDetailsSubtitle')}
              />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
                <div className="space-y-4 lg:col-span-5">
                  <BudgetSelector
                    selectedBudget={selectedBudget}
                    availableBudgets={userBudgets}
                    users={groupUsers}
                    onBudgetSelect={handleBudgetSelect}
                  />

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

                  {selectedBudgetProgress && (
                    <>
                      <BudgetProgress
                        progressData={{
                          percentage: selectedBudgetProgress.percentage,
                          spent: selectedBudgetProgress.spent,
                          remaining: selectedBudgetProgress.remaining,
                          amount: selectedBudgetProgress.amount,
                        }}
                      />

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
                    </>
                  )}
                </div>

                {selectedBudgetProgress && (
                  <div className="space-y-4 lg:col-span-7">
                    <TransactionDayList
                      groupedTransactions={groupedTransactions}
                      accountNames={accountNamesMap}
                      categories={hookCategories}
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
                  </div>
                )}
              </div>
            </PageSection>
          </section>
        ) : (
          <section
            aria-labelledby="budgets-section-empty-title"
            className={`mt-5 sm:mt-6 ${reportsStyles.section.surface}`}
          >
            <PageSection className="py-2">
              <EmptyState
                icon={ShoppingCart}
                titleId="budgets-section-empty-title"
                title={t('emptyState.title')}
                description={t('emptyState.description')}
                action={
                  <Button onClick={handleCreateBudget} variant="default" size="sm">
                    {t('emptyState.createButton')} →
                  </Button>
                }
              />
            </PageSection>
          </section>
        )}
      </main>

      <BottomNavigation />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onCancel={handleCancelDelete}
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
