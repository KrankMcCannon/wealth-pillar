'use client';

import { use, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { HomeDashboardMain } from '@/components/layout/home-dashboard-layout';
import { usePageHeader } from '@/hooks/use-page-header';
import { BudgetCategoryLucideIcon } from '@/features/budgets/components/budget-category-lucide-icon';
import { getBudgetCategoryStatus } from '@/features/budgets/components/budget-category-card';
import { BudgetProgressBar } from '@/features/budgets/components/budget-progress-bar';
import { TransactionDayList } from '@/features/transactions';
import { useTransactionEditStore } from '@/features/transactions/stores/transaction-edit-store';
import { useModalState } from '@/lib/navigation/url-state';
import { toDateTime } from '@/lib/utils/date-utils';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';
import type { User } from '@/lib/types';
import type { BudgetDetailPageData } from '@/server/use-cases/pages/budget-detail-page.types';
import { formatGroupedTransactionsForClient } from '@/features/budgets/utils/format-budget-detail-transactions';
import { stitchBudgets, stitchHome } from '@/styles/home-design-foundation';
import { cn } from '@/lib/utils';
import { withReturnTo } from '@/lib/navigation/return-to';

interface BudgetDetailContentProps {
  currentUser: User;
  pageDataPromise: Promise<BudgetDetailPageData>;
}

export default function BudgetDetailContent({ pageDataPromise }: BudgetDetailContentProps) {
  const pageData = use(pageDataPromise);
  const {
    budget,
    progress,
    periodStart,
    periodEnd,
    categoryBreakdown,
    groupedTransactions,
    categories,
  } = pageData;

  const t = useTranslations('Budgets.Detail');
  const locale = useLocale();
  const { openModal } = useModalState();
  const setTransactionEditSeed = useTransactionEditStore((state) => state.setSeed);

  const status = getBudgetCategoryStatus(progress);
  const categoryKey = progress.categories[0] ?? '';

  const formattedGroups = useMemo(
    () => formatGroupedTransactionsForClient(groupedTransactions, locale),
    [groupedTransactions, locale]
  );

  const viewAllHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set('user', budget.user_id);
    if (budget.categories.length > 0) {
      params.set('categories', budget.categories.join(','));
    }
    params.set('dateRange', 'custom');
    if (periodStart) {
      const startDt = toDateTime(periodStart);
      if (startDt) params.set('startDate', startDt.toISODate() ?? periodStart);
    }
    if (periodEnd) {
      const endDt = toDateTime(periodEnd);
      if (endDt) params.set('endDate', endDt.toISODate() ?? periodEnd);
    }
    return withReturnTo(`/transactions?${params.toString()}`, `/budgets/${budget.id}`);
  }, [budget.id, budget.user_id, budget.categories, periodStart, periodEnd]);

  const iconWrapClass =
    status === 'over'
      ? stitchBudgets.iconWrapOver
      : status === 'fixed'
        ? stitchBudgets.iconWrapFixed
        : stitchBudgets.iconWrapOnTrack;

  usePageHeader({
    title: budget.description,
    backHref: `/budgets?user=${encodeURIComponent(budget.user_id)}`,
  });

  return (
    <>
      <HomeDashboardMain id="main-budget-detail">
        <div className={stitchBudgets.mainStack}>
          <div className="flex justify-end">
            <button
              type="button"
              className={stitchHome.viewAllLink}
              onClick={() => openModal('budget', budget.id)}
            >
              {t('editBudget')}
            </button>
          </div>

          <section className={stitchBudgets.categoryCard} aria-label={t('summaryAria')}>
            <div className={stitchBudgets.categoryHeaderRow}>
              <div className={stitchBudgets.categoryTitleRow}>
                <span className={iconWrapClass} aria-hidden>
                  <BudgetCategoryLucideIcon
                    categoryIdentifier={categoryKey}
                    categories={categories}
                    className="h-5 w-5 shrink-0"
                  />
                </span>
                <h2 className={stitchBudgets.categoryTitle}>{budget.description}</h2>
              </div>
              <p
                className={cn(stitchBudgets.spentStrong, progress.remaining < 0 && 'text-expense')}
              >
                {formatCurrencyLocale(progress.remaining, locale)}
              </p>
            </div>
            <p className="text-sm tabular-nums text-muted-foreground">
              {formatCurrencyLocale(progress.spent, locale)} {t('metrics.spent')} ·{' '}
              {formatCurrencyLocale(progress.amount, locale)} {t('metrics.limit')}
            </p>
            <BudgetProgressBar
              percent={progress.percentage}
              label={t('progressAria', { percent: Math.round(progress.percentage) })}
              fillClassName={cn(
                status === 'over' && stitchBudgets.progressFillOver,
                status === 'fixed' && stitchBudgets.progressFillFixed,
                status === 'onTrack' && stitchBudgets.progressFillPrimary
              )}
            />
          </section>

          {categoryBreakdown.length > 0 ? (
            <section className={stitchHome.scanSection} aria-labelledby="budget-categories-heading">
              <h2 id="budget-categories-heading" className={stitchHome.scanSectionTitle}>
                {t('categoriesTitle')}
              </h2>
              <ul className={stitchHome.plainList}>
                {categoryBreakdown.map((item) => (
                  <li key={item.key} className={stitchHome.plainRow}>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={stitchBudgets.iconWrapOnTrack} aria-hidden>
                        <BudgetCategoryLucideIcon
                          categoryIdentifier={item.key}
                          categories={categories}
                          className="h-5 w-5 shrink-0"
                        />
                      </span>
                      <span className={stitchHome.plainRowTitle}>{item.label}</span>
                    </span>
                    <span className="shrink-0 text-base font-semibold tabular-nums text-foreground">
                      {formatCurrencyLocale(item.spent, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <TransactionDayList
            groupedTransactions={formattedGroups}
            categories={categories}
            sectionTitle={t('transactions.sectionTitle')}
            emptyTitle={t('transactions.emptyTitle')}
            emptyDescription={t('transactions.emptyDescription')}
            showViewAll
            viewAllLabel={t('transactions.viewAll')}
            viewAllHref={viewAllHref}
            onEditTransaction={(transaction) => {
              setTransactionEditSeed(transaction);
              openModal('transaction', transaction.id);
            }}
          />
        </div>
      </HomeDashboardMain>
    </>
  );
}
