'use client';

/**
 * Budgets Content — Stitch dark layout; member context via `?userId=` from home.
 */

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, ShoppingCart } from 'lucide-react';
import { AppPage, PageFab } from '@/components/layout';
import { EmptyState } from '@/components/shared';
import {
  BudgetChart,
  BudgetsSummaryHero,
  BudgetCategoryCard,
  CloseBudgetPeriodModal,
} from '@/features/budgets/components';
import { TransactionDayList } from '@/features/transactions';
import { useTransactionEditStore } from '@/features/transactions/stores/transaction-edit-store';
import { useBudgetsContent, type UseBudgetsContentProps } from '@/features/budgets';
import type { User, UserBudgetSummary } from '@/lib/types';
import type { BudgetsPageData } from '@/server/use-cases/pages/budgets-page.use-case';
import { stitchBudgets } from '@/styles/home-design-foundation';
import { Button } from '@/components/ui';
import { useBudgets, useReferenceDataStore } from '@/stores/reference-data-store';

type BudgetsPagePayload = BudgetsPageData & {
  budgetsByUser: Record<string, UserBudgetSummary>;
};

interface BudgetsContentProps {
  currentUser: User;
  groupUsers: User[];
  pageDataPromise: Promise<BudgetsPagePayload>;
}

export default function BudgetsContent({
  currentUser,
  groupUsers,
  pageDataPromise,
}: BudgetsContentProps) {
  const pageData = use(pageDataPromise);
  const {
    transactions = [],
    accounts = [],
    categories = [],
    budgetPeriods = {},
    budgetsByUser = {},
  } = pageData;

  const storeBudgets = useBudgets();
  const refreshBudgets = useReferenceDataStore((state) => state.refreshBudgets);

  useEffect(() => {
    refreshBudgets(pageData.budgets ?? []);
  }, [pageData.budgets, refreshBudgets]);

  const budgets = storeBudgets.length > 0 ? storeBudgets : (pageData.budgets ?? []);

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
    budgetContextUserId,
    selectedBudget,
    selectedBudgetProgress,
    userBudgets,
    userBudgetSummary,
    periodInfo,
    groupedTransactions,
    chartAggregateSpent,
    chartData,
    transactionSectionSubtitle,
    accountNamesMap,
    categories: hookCategories,
    handleBudgetSelect,
    handleCreateBudget,
    handleEditBudgetById,
    openModal,
  } = useBudgetsContent(props);
  const setTransactionEditSeed = useTransactionEditStore((state) => state.setSeed);
  const [isClosePeriodModalOpen, setIsClosePeriodModalOpen] = useState(false);

  return (
    <AppPage
      currentUser={currentUser}
      title={t('title')}
      subtitle={t('pageSubtitle')}
      showBack
      showActions
      skipToMainHref="#main-budgets"
      skipToMainLabel={t('skipToMain')}
      dashboardMain
      mainId="main-budgets"
      decor={
        <div className={stitchBudgets.decorWrap} aria-hidden>
          <div className={stitchBudgets.decorBlobTL} />
          <div className={stitchBudgets.decorBlobBR} />
        </div>
      }
      afterMain={
        <PageFab
          onClick={handleCreateBudget}
          ariaLabel={t('fabAddBudget')}
          testId="budgets-fab-add"
        />
      }
    >
      <div className={stitchBudgets.mainStack}>
        {userBudgetSummary && userBudgetSummary.budgets.length > 0 ? (
          <>
            <BudgetsSummaryHero
              summary={userBudgetSummary}
              labels={{
                totalAvailable: t('hero.totalAvailable'),
                totalBudgeted: t('hero.totalBudgeted'),
                totalSpent: t('hero.totalSpent'),
              }}
            />

            <div className="flex justify-center">
              <button
                type="button"
                className={stitchBudgets.closePeriodButton}
                onClick={() => setIsClosePeriodModalOpen(true)}
              >
                <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
                {t('closePeriod')}
              </button>
            </div>

            <CloseBudgetPeriodModal
              key={isClosePeriodModalOpen ? budgetContextUserId : 'closed'}
              isOpen={isClosePeriodModalOpen}
              onClose={() => setIsClosePeriodModalOpen(false)}
              userId={budgetContextUserId}
            />

            <div className={stitchBudgets.listStack}>
              {userBudgetSummary.budgets.map((bp) => (
                <BudgetCategoryCard
                  key={bp.id}
                  progress={bp}
                  categories={hookCategories}
                  isSelected={selectedBudget?.id === bp.id}
                  onPress={() => {
                    handleBudgetSelect(bp.id);
                    handleEditBudgetById(bp.id);
                  }}
                />
              ))}
            </div>
          </>
        ) : null}

        {userBudgets.length > 0 && selectedBudget && userBudgetSummary ? (
          <section
            aria-labelledby="budgets-detail-heading"
            className={stitchBudgets.detailsSection}
          >
            <h2 id="budgets-detail-heading" className="sr-only">
              {t('sectionDetailsTitle')}
            </h2>

            {selectedBudgetProgress ? (
              <>
                <BudgetChart
                  spent={chartAggregateSpent}
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
                    params.set('user', budgetContextUserId);
                    const unionKeys = [...new Set(userBudgets.flatMap((b) => b.categories))];
                    if (unionKeys.length > 0) {
                      params.set('categories', unionKeys.join(','));
                    }
                    params.set('dateRange', 'custom');
                    if (periodInfo?.start) {
                      params.set('startDate', periodInfo.start);
                    }
                    if (periodInfo?.end) {
                      params.set('endDate', periodInfo.end);
                    }
                    router.push(`/transactions?${params.toString()}`);
                  }}
                  onEditTransaction={(transaction) => {
                    setTransactionEditSeed(transaction);
                    openModal('transaction', transaction.id);
                  }}
                />
              </>
            ) : null}
          </section>
        ) : null}

        {userBudgets.length === 0 ? (
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
        ) : null}
      </div>
    </AppPage>
  );
}
