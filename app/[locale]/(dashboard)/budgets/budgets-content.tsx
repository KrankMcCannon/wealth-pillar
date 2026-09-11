'use client';

/**
 * Budgets Content — member context via UserSelector + `?user=`.
 */

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageFab, HomeDashboardMain } from '@/components/layout';
import { usePageHeader } from '@/hooks/use-page-header';
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
import { stitchBudgets, stitchRecurring, stitchSurface } from '@/styles/home-design-foundation';
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
    isModalOpen,
  } = useBudgetsContent(props);
  const [isClosePeriodModalOpen, setIsClosePeriodModalOpen] = useState(false);
  const [isEditClosingDateModalOpen, setIsEditClosingDateModalOpen] = useState(false);
  const [periodStatusMessage, setPeriodStatusMessage] = useState('');

  usePageHeader({
    title: t('title'),
  });

  return (
    <>
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
                    href={`/budgets/${encodeURIComponent(bp.id)}`}
                  />
                ))}
              </div>

              <BudgetChart spent={chartAggregateSpent} chartData={chartData} />
            </>
          ) : null}

          {userBudgetSummary && userBudgetSummary.budgets.length === 0 ? (
            <div className={stitchRecurring.emptyState} role="status" aria-live="polite">
              <p id="budgets-section-empty-title" className={stitchRecurring.emptyTitle}>
                {t('emptyState.title')}
              </p>
              <p className={stitchRecurring.emptyDescription}>{t('emptyState.description')}</p>
              <div className={stitchRecurring.emptyActions}>
                <button type="button" onClick={handleCreateBudget} className={stitchSurface.primaryCta}>
                  {t('emptyState.createButton')}
                </button>
              </div>
            </div>
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
