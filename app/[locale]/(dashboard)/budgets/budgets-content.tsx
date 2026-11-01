'use client';

/**
 * Budgets Content — member context via UserSelector + `?user=`.
 */

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageFab, HomeDashboardMain } from '@/components/layout';
import { Link } from '@/i18n/routing';
import { usePageHeader } from '@/hooks/use-page-header';
import UserSelector from '@/components/shared/user-selector';
import {
  BudgetChart,
  BudgetsSummaryHero,
  BudgetCategoryCard,
  BudgetPeriodHeader,
  StartSalaryPeriodModal,
  EditClosingDateModal,
} from '@/features/budgets/components';
import { useBudgetsContent, type UseBudgetsContentProps } from '@/features/budgets';
import type { User, UserBudgetSummary } from '@/lib/types';
import type { BudgetsPageData } from '@/server/use-cases/pages/budgets-page.use-case';
import { stitchBudgets, stitchRecurring, stitchSurface } from '@/styles/home-design-foundation';
import { useReferenceDataStore } from '@/stores/reference-data-store';
import { SectionDisclosure } from '@/components/shared/section-disclosure';

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
  const ux = useTranslations('Budgets.UX');
  const [order, setOrder] = useState('priority');
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
  const [isStartSalaryPeriodOpen, setIsStartSalaryPeriodOpen] = useState(false);
  const [isEditClosingDateModalOpen, setIsEditClosingDateModalOpen] = useState(false);
  const [periodStatusMessage, setPeriodStatusMessage] = useState('');

  usePageHeader({
    title: t('title'),
  });

  return (
    <>
      <HomeDashboardMain
        id="main-budgets"
        className="mx-auto max-w-5xl pb-[calc(11rem+env(safe-area-inset-bottom))]"
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

          {userBudgetSummary ? (
            <>
              <h2 className="sr-only">
                {ux('context', {
                  name:
                    groupUsers.find((u) => u.id === budgetContextUserId)?.name ??
                    currentUser.name ??
                    '',
                })}
              </h2>
              <BudgetPeriodHeader
                periodStart={userBudgetSummary.periodStart}
                periodEnd={userBudgetSummary.periodEnd}
                onStartSalaryPeriod={() => setIsStartSalaryPeriodOpen(true)}
                onEditClosingDate={() => setIsEditClosingDateModalOpen(true)}
              />

              {userBudgetSummary.budgets.length > 0 ? (
                <BudgetsSummaryHero
                  summary={userBudgetSummary}
                  labels={{
                    totalAvailable: t('hero.totalAvailable'),
                    totalSpent: t('hero.totalSpent'),
                    totalAssigned: t('hero.totalAssigned'),
                    srHeading: t('hero.srHeading'),
                  }}
                />
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{ux('envelopes')}</h2>
                <Link
                  className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/reports?member=${encodeURIComponent(budgetContextUserId)}&periods=open#budget-periods`}
                >
                  {ux('history')}
                </Link>
              </div>
              {userBudgetSummary.budgets.length > 5 ? (
                <label className="flex items-center justify-end gap-2 text-sm">
                  <span className="sr-only">{ux('sort')}</span>
                  <select
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="min-h-11 rounded-lg border border-border bg-background px-3"
                  >
                    <option value="priority">{ux('priority')}</option>
                    <option value="name">{ux('alphabetical')}</option>
                  </select>
                </label>
              ) : null}

              <div role="status" aria-live="polite" className="sr-only">
                {periodStatusMessage}
              </div>

              <StartSalaryPeriodModal
                key={
                  isStartSalaryPeriodOpen
                    ? `${budgetContextUserId}-salary-period`
                    : 'salary-period-closed'
                }
                isOpen={isStartSalaryPeriodOpen}
                onClose={() => setIsStartSalaryPeriodOpen(false)}
                onSuccess={() => setPeriodStatusMessage(t('salaryPeriodSuccess'))}
                userId={budgetContextUserId}
                userName={
                  groupUsers.find((u) => u.id === budgetContextUserId)?.name ??
                  currentUser.name ??
                  ''
                }
                periodStart={userBudgetSummary.periodStart}
              />

              <EditClosingDateModal
                key={isEditClosingDateModalOpen ? `${budgetContextUserId}-edit` : 'edit-closed'}
                isOpen={isEditClosingDateModalOpen}
                onClose={() => setIsEditClosingDateModalOpen(false)}
                userId={budgetContextUserId}
              />

              <div className="grid items-start gap-4 md:grid-cols-2">
                {[...userBudgetSummary.budgets]
                  .sort((a, b) =>
                    order === 'name'
                      ? a.description.localeCompare(b.description)
                      : Number(a.remaining > 0) - Number(b.remaining > 0) ||
                        b.percentage - a.percentage ||
                        a.description.localeCompare(b.description)
                  )
                  .map((bp) => (
                    <BudgetCategoryCard
                      key={bp.id}
                      progress={bp}
                      categories={hookCategories}
                      isSelected={false}
                      href={`/budgets/${encodeURIComponent(bp.id)}`}
                    />
                  ))}
              </div>
              {userBudgetSummary.budgets.length > 0 ? (
                <div className="divide-y divide-border/40 border-t border-border/40">
                  <SectionDisclosure label={ux('trend')}>
                    <BudgetChart spent={chartAggregateSpent} chartData={chartData} />
                  </SectionDisclosure>
                  {userBudgetSummary.budgets.some((budget, index, all) =>
                    all.some(
                      (other, otherIndex) =>
                        index !== otherIndex &&
                        budget.categories.some((key) => other.categories.includes(key))
                    )
                  ) ? (
                    <SectionDisclosure label={ux('sharedTitle')}>
                      <p className="max-w-prose text-sm text-muted-foreground">
                        {t('hero.envelopeHelp')}
                      </p>
                    </SectionDisclosure>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          {!userBudgetSummary ? (
            <div role="alert">
              <p>{ux('missing')}</p>
              <button
                type="button"
                className="min-h-11 underline"
                onClick={() => window.location.reload()}
              >
                {ux('retry')}
              </button>
            </div>
          ) : null}
          {userBudgetSummary && userBudgetSummary.budgets.length === 0 ? (
            <div className={stitchRecurring.emptyState} role="status" aria-live="polite">
              <p id="budgets-section-empty-title" className={stitchRecurring.emptyTitle}>
                {t('emptyState.title')}
              </p>
              <div className={stitchRecurring.emptyActions}>
                <button
                  type="button"
                  onClick={handleCreateBudget}
                  className={stitchSurface.primaryCta}
                >
                  {t('emptyState.createButton')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </HomeDashboardMain>
      <PageFab
        className="bottom-[calc(6rem+env(safe-area-inset-bottom))]"
        onClick={handleCreateBudget}
        ariaLabel={t('fabAddBudget')}
        testId="budgets-fab-add"
        hidden={
          isModalOpen ||
          isStartSalaryPeriodOpen ||
          isEditClosingDateModalOpen ||
          userBudgetSummary?.budgets.length === 0
        }
      />
    </>
  );
}
