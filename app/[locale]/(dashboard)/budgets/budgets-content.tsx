'use client';

/**
 * Budgets Content — Stitch dark layout; member context via UserSelector + `?user=`.
 */

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingCart } from 'lucide-react';
import { PageFab, HomeDashboardMain } from '@/components/layout';
import { usePageHeader } from '@/hooks/use-page-header';
import { EmptyState } from '@/components/shared';
import UserSelector from '@/components/shared/user-selector';
import {
  BudgetChart,
  BudgetsSummaryHero,
  BudgetCategoryCard,
  BudgetPeriodHeader,
  CloseBudgetPeriodModal,
  EditClosingDateModal,
} from '@/features/budgets/components';
import { useBudgetsContent, type UseBudgetsContentProps } from '@/features/budgets';
import type { User, UserBudgetSummary } from '@/lib/types';
import type { BudgetsPageData } from '@/server/use-cases/pages/budgets-page.use-case';
import { stitchBudgets } from '@/styles/home-design-foundation';
import { Button } from '@/components/ui';
import { useReferenceDataStore } from '@/stores/reference-data-store';

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

  const refreshBudgets = useReferenceDataStore((state) => state.refreshBudgets);

  useEffect(() => {
    refreshBudgets(pageData.budgets ?? []);
  }, [pageData.budgets, refreshBudgets]);

  const budgets = pageData.budgets ?? [];

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
    isModalOpen,
  } = useBudgetsContent(props);
  const [isClosePeriodModalOpen, setIsClosePeriodModalOpen] = useState(false);
  const [isEditClosingDateModalOpen, setIsEditClosingDateModalOpen] = useState(false);
  const [periodStatusMessage, setPeriodStatusMessage] = useState('');

  usePageHeader({
    title: t('title'),
    showBack: true,
    isDashboard: false,
  });

  return (
    <>
      <div className={stitchBudgets.decorWrap} aria-hidden>
        <div className={stitchBudgets.decorBlobTL} />
        <div className={stitchBudgets.decorBlobBR} />
      </div>
      <HomeDashboardMain id="main-budgets">
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
              <BudgetPeriodHeader
                periodStart={userBudgetSummary.periodStart}
                periodEnd={userBudgetSummary.periodEnd}
                onClosePeriod={() => setIsClosePeriodModalOpen(true)}
                onEditClosingDate={() => setIsEditClosingDateModalOpen(true)}
              />

              <BudgetsSummaryHero
                summary={userBudgetSummary}
                labels={{
                  totalAvailable: t('hero.totalAvailable'),
                  totalSpent: t('hero.totalSpent'),
                  totalAssigned: t('hero.totalAssigned'),
                  srHeading: t('hero.srHeading'),
                }}
              />

              <div role="status" aria-live="polite" className="sr-only">
                {periodStatusMessage}
              </div>

              <CloseBudgetPeriodModal
                key={isClosePeriodModalOpen ? budgetContextUserId : 'closed'}
                isOpen={isClosePeriodModalOpen}
                onClose={() => setIsClosePeriodModalOpen(false)}
                onSuccess={() => setPeriodStatusMessage(t('periodCloseSuccess'))}
                userId={budgetContextUserId}
              />

              <EditClosingDateModal
                key={isEditClosingDateModalOpen ? `${budgetContextUserId}-edit` : 'edit-closed'}
                isOpen={isEditClosingDateModalOpen}
                onClose={() => setIsEditClosingDateModalOpen(false)}
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
      </HomeDashboardMain>
      <PageFab
        onClick={handleCreateBudget}
        ariaLabel={t('fabAddBudget')}
        testId="budgets-fab-add"
        hidden={isModalOpen || isClosePeriodModalOpen || isEditClosingDateModalOpen}
      />
    </>
  );
}
