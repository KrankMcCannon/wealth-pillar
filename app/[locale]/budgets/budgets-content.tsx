'use client';

/**
 * Budgets Content — Stitch dark layout; member context via UserSelector + `?userId=`.
 */

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, ShoppingCart } from 'lucide-react';
import { AppPage, PageFab } from '@/components/layout';
import { EmptyState } from '@/components/shared';
import UserSelector from '@/components/shared/user-selector';
import {
  BudgetChart,
  BudgetsSummaryHero,
  BudgetCategoryCard,
  CloseBudgetPeriodModal,
} from '@/features/budgets/components';
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
  const { categories = [], budgetsByUser = {}, chartViewModelsByUser = {} } = pageData;

  const storeBudgets = useBudgets();
  const refreshBudgets = useReferenceDataStore((state) => state.refreshBudgets);

  useEffect(() => {
    refreshBudgets(pageData.budgets ?? []);
  }, [pageData.budgets, refreshBudgets]);

  const budgets = storeBudgets.length > 0 ? storeBudgets : (pageData.budgets ?? []);

  const props: UseBudgetsContentProps = {
    categories: categories || [],
    budgets: budgets || [],
    currentUser,
    groupUsers,
    precalculatedData: budgetsByUser,
    chartViewModelsByUser,
  };

  const t = useTranslations('Budgets.Page');
  const {
    budgetContextUserId,
    userBudgetSummary,
    chartAggregateSpent,
    chartData,
    categories: hookCategories,
    handleCreateBudget,
    handleSelectUser,
    handleOpenBudgetDetail,
  } = useBudgetsContent(props);
  const [isClosePeriodModalOpen, setIsClosePeriodModalOpen] = useState(false);

  return (
    <AppPage
      currentUser={currentUser}
      title={t('title')}
      subtitle={t('pageSubtitle')}
      showBack
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
        <UserSelector
          users={groupUsers}
          currentUser={currentUser}
          value={budgetContextUserId}
          onChange={handleSelectUser}
          showAllOption={false}
          hideTitle
        />

        {userBudgetSummary && userBudgetSummary.budgets.length > 0 ? (
          <>
            <BudgetsSummaryHero
              summary={userBudgetSummary}
              labels={{
                totalAvailable: t('hero.totalAvailable'),
                totalBudgeted: t('hero.totalBudgeted'),
                totalSpent: t('hero.totalSpent'),
                spendableSpent: t('hero.spendableSpent'),
                reserveSaved: t('hero.reserveSaved'),
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
                  isSelected={false}
                  onPress={() => handleOpenBudgetDetail(bp.id)}
                />
              ))}
            </div>

            <BudgetChart spent={chartAggregateSpent} chartData={chartData} />
          </>
        ) : null}

        {userBudgetSummary && userBudgetSummary.budgets.length === 0 ? (
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
