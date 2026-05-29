'use client';

import { use, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Pencil } from 'lucide-react';
import { AppPage } from '@/components/layout';
import { Button } from '@/components/ui';
import { BudgetCategoryLucideIcon } from '@/features/budgets/components/budget-category-lucide-icon';
import { getBudgetCategoryStatus } from '@/features/budgets/components/budget-category-card';
import { TransactionDayList } from '@/features/transactions';
import { useTransactionEditStore } from '@/features/transactions/stores/transaction-edit-store';
import { useModalState } from '@/lib/navigation/url-state';
import { useIdNameMap } from '@/hooks';
import { formatDateShort, toDateTime } from '@/lib/utils/date-utils';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';
import type { User } from '@/lib/types';
import type { BudgetDetailPageData } from '@/server/use-cases/pages/budget-detail-page.types';
import { formatGroupedTransactionsForClient } from '@/features/budgets/utils/format-budget-detail-transactions';
import { stitchBudgets } from '@/styles/home-design-foundation';
import { cn } from '@/lib/utils';
import { useRouter } from '@/i18n/routing';

interface BudgetDetailContentProps {
  currentUser: User;
  pageDataPromise: Promise<BudgetDetailPageData>;
}

export default function BudgetDetailContent({
  currentUser,
  pageDataPromise,
}: BudgetDetailContentProps) {
  const pageData = use(pageDataPromise);
  const {
    budget,
    progress,
    periodStart,
    periodEnd,
    categoryBreakdown,
    groupedTransactions,
    accounts,
    categories,
  } = pageData;

  const t = useTranslations('Budgets.Detail');
  const locale = useLocale();
  const router = useRouter();
  const { openModal } = useModalState();
  const setTransactionEditSeed = useTransactionEditStore((state) => state.setSeed);
  const accountNamesMap = useIdNameMap(accounts);

  const status = getBudgetCategoryStatus(progress);
  const categoryKey = progress.categories[0] ?? '';

  const periodSubtitle = useMemo(() => {
    if (!periodStart) return '';
    const startFormatted = formatDateShort(periodStart, locale);
    const endFormatted = periodEnd ? formatDateShort(periodEnd, locale) : t('today');
    return `${startFormatted} - ${endFormatted}`;
  }, [periodStart, periodEnd, locale, t]);

  const formattedGroups = useMemo(
    () => formatGroupedTransactionsForClient(groupedTransactions, locale),
    [groupedTransactions, locale]
  );

  const iconWrapClass =
    status === 'over'
      ? stitchBudgets.iconWrapOver
      : status === 'fixed'
        ? stitchBudgets.iconWrapFixed
        : stitchBudgets.iconWrapOnTrack;

  return (
    <AppPage
      currentUser={currentUser}
      title={budget.description}
      subtitle={periodSubtitle}
      showBack
      onBack={() => router.push(`/budgets?userId=${encodeURIComponent(budget.user_id)}`)}
      skipToMainHref="#main-budget-detail"
      skipToMainLabel={t('skipToMain')}
      dashboardMain
      mainId="main-budget-detail"
    >
      <div className={stitchBudgets.mainStack}>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openModal('budget', budget.id)}
          >
            <Pencil data-icon="inline-start" />
            {t('editBudget')}
          </Button>
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
            {status === 'onTrack' ? (
              <span className={stitchBudgets.badgeOnTrack}>{t('badgeOnTrack')}</span>
            ) : null}
            {status === 'fixed' ? (
              <span className={stitchBudgets.badgeFixed}>{t('badgeFixed')}</span>
            ) : null}
            {status === 'over' ? (
              <span className={stitchBudgets.badgeOver}>{t('badgeOver')}</span>
            ) : null}
          </div>

          <div className={stitchBudgets.heroMetricsRow}>
            <div>
              <p className={stitchBudgets.heroMetricLabel}>{t('metrics.spent')}</p>
              <p className={stitchBudgets.heroMetricValue}>
                {formatCurrencyLocale(progress.spent, locale)}
              </p>
            </div>
            <div>
              <p className={stitchBudgets.heroMetricLabel}>{t('metrics.limit')}</p>
              <p className={stitchBudgets.heroMetricValue}>
                {formatCurrencyLocale(progress.amount, locale)}
              </p>
            </div>
            <div>
              <p className={stitchBudgets.heroMetricLabel}>{t('metrics.remaining')}</p>
              <p
                className={cn(
                  stitchBudgets.heroMetricValue,
                  progress.remaining < 0 && 'text-expense'
                )}
              >
                {formatCurrencyLocale(progress.remaining, locale)}
              </p>
            </div>
          </div>
        </section>

        {categoryBreakdown.length > 0 ? (
          <section aria-labelledby="budget-categories-heading">
            <h2 id="budget-categories-heading" className={stitchBudgets.heroEyebrow}>
              {t('categoriesTitle')}
            </h2>
            <ul className={`${stitchBudgets.listStack} mt-3`}>
              {categoryBreakdown.map((item) => (
                <li
                  key={item.key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/25 bg-card/90 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className={stitchBudgets.iconWrapOnTrack} aria-hidden>
                      <BudgetCategoryLucideIcon
                        categoryIdentifier={item.key}
                        categories={categories}
                        className="h-5 w-5 shrink-0"
                      />
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrencyLocale(item.spent, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <TransactionDayList
          groupedTransactions={formattedGroups}
          accountNames={accountNamesMap}
          categories={categories}
          sectionTitle={t('transactions.sectionTitle')}
          sectionSubtitle={periodSubtitle}
          emptyTitle={t('transactions.emptyTitle')}
          emptyDescription={t('transactions.emptyDescription')}
          expensesOnly
          showViewAll
          viewAllLabel={t('transactions.viewAll')}
          onViewAll={() => {
            const params = new URLSearchParams();
            params.set('from', 'budgets');
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
            router.push(`/transactions?${params.toString()}`);
          }}
          onEditTransaction={(transaction) => {
            setTransactionEditSeed(transaction);
            openModal('transaction', transaction.id);
          }}
        />
      </div>
    </AppPage>
  );
}
