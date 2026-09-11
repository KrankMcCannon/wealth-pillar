'use client';

import { use, useCallback, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { HomeDashboardMain } from '@/components/layout';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { usePageHeader } from '@/hooks/use-page-header';
import { toast } from '@/hooks/use-toast';
import { useRouter } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { stitchHome, stitchReports, stitchSurface } from '@/styles/home-design-foundation';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';
import { TopExpensesRanking } from '@/features/reports/components/top-expenses-ranking';
import {
  buildPeriodTransactionsHref,
  buildReportsSearchQuery,
} from '@/features/reports/utils/reports-transactions-href';
import type { ReportsTimePreset } from '@/features/reports/utils/reporting-window';
import type { ReportsScope } from '@/server/use-cases/pages/reports-page.use-case';
import type { ReportPeriodDetailPageData } from '@/server/use-cases/pages/report-period-detail-page.use-case';
import EditClosingDateModal from '@/features/budgets/components/edit-closing-date-modal';
import BudgetFormModal from '@/features/budgets/components/budget-form-modal';
import { BudgetCategoryCard } from '@/features/budgets/components/budget-category-card';
import {
  recalculateClosedPeriodAction,
  rewindClosedPeriodAction,
} from '@/features/budgets/actions/budget-period-actions';

function CompareRow({
  label,
  stored,
  live,
  formatMoney,
}: {
  label: string;
  stored: number;
  live: number;
  formatMoney: (value: number) => string;
}) {
  const storedLabel = formatMoney(stored);
  const liveLabel = formatMoney(live);
  const drifted = storedLabel !== liveLabel;

  return (
    <tr>
      <th scope="row" className={stitchReports.periodCompareRowLabel}>
        {label}
      </th>
      <td className={stitchReports.periodCompareCell}>{storedLabel}</td>
      <td
        className={cn(
          drifted ? stitchReports.periodCompareCellDrift : stitchReports.periodCompareCellLive,
          'pl-3'
        )}
      >
        {liveLabel}
      </td>
    </tr>
  );
}

interface PeriodDetailContentProps {
  pageDataPromise: Promise<ReportPeriodDetailPageData>;
  backPreset: ReportsTimePreset;
  backCustomStart?: string | undefined;
  backCustomEnd?: string | undefined;
  backScope: ReportsScope;
}

export default function PeriodDetailContent({
  pageDataPromise,
  backPreset,
  backCustomStart,
  backCustomEnd,
  backScope,
}: PeriodDetailContentProps) {
  const pageData = use(pageDataPromise);
  const t = useTranslations('Reports.PeriodDetail');
  const tPeriods = useTranslations('Reports.BudgetPeriods');
  const locale = useLocale();
  const router = useRouter();
  const { format: formatMoney } = useFormatCurrency();

  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [budgetFormOpen, setBudgetFormOpen] = useState(false);
  const [budgetEditId, setBudgetEditId] = useState<string | null>(null);

  const backQuery = buildReportsSearchQuery({
    preset: backPreset,
    customRange:
      backPreset === 'custom' && backCustomStart && backCustomEnd
        ? { start: backCustomStart, end: backCustomEnd }
        : null,
    scope: backScope,
  });
  const backHref = backQuery ? `/reports?${backQuery}` : '/reports';

  const transactionsHref = buildPeriodTransactionsHref({
    startDate: pageData.startDate,
    endDate: pageData.endDate,
    userId: pageData.userId,
  });

  usePageHeader({
    title: pageData.summary.name,
    showBack: true,
    isDashboard: false,
    onBack: () => router.push(backHref, { scroll: false }),
  });

  const remaining = pageData.summary.remaining;
  const remainingSigned = `${remaining > 0 ? '+' : ''}${formatMoney(remaining)}`;

  const handleRecalculate = useCallback(async () => {
    if (isRecalculating) return;
    setIsRecalculating(true);
    try {
      const result = await recalculateClosedPeriodAction(
        pageData.userId,
        pageData.periodId,
        locale
      );
      if (result.error || !result.data) {
        toast({
          title: t('toast.recalculateErrorTitle'),
          description: result.error ?? t('toast.recalculateErrorDescription'),
          variant: 'destructive',
        });
        return;
      }
      router.refresh();
      toast({
        title: t('toast.recalculateSuccessTitle'),
        description: t('toast.recalculateSuccessDescription'),
        variant: 'success',
      });
    } finally {
      setIsRecalculating(false);
    }
  }, [
    isRecalculating,
    locale,
    pageData.periodId,
    pageData.userId,
    router,
    t,
  ]);

  const handleRewind = useCallback(async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await rewindClosedPeriodAction(pageData.userId, pageData.periodId, locale);
      if (result.error || !result.data) {
        toast({
          title: t('toast.deleteErrorTitle'),
          description: result.error ?? t('toast.deleteErrorDescription'),
          variant: 'destructive',
        });
        return;
      }
      setDeleteOpen(false);
      toast({
        title: t('toast.deleteSuccessTitle'),
        description: t('toast.deleteSuccessDescription'),
        variant: 'success',
      });
      router.push(backHref, { scroll: false });
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }, [backHref, isDeleting, locale, pageData.periodId, pageData.userId, router, t]);

  return (
    <>
      <HomeDashboardMain id="main-report-period-detail">
        <div className={stitchReports.sectionStack}>
          <section className={stitchHome.scanSection} aria-labelledby="period-metrics-heading">
            <div className={stitchHome.scanSectionHeader}>
              <h2 id="period-metrics-heading" className={stitchHome.scanSectionTitle}>
                {t('metricsTitle')}
              </h2>
              <span
                className={cn(
                  'shrink-0 text-base font-semibold tabular-nums',
                  remaining < 0 ? stitchHome.amountExpense : stitchHome.amountIncome
                )}
                aria-label={`${remaining < 0 ? tPeriods('badgeOverBudget') : tPeriods('badgeOnTrack')} ${remainingSigned}`}
              >
                {remainingSigned}
              </span>
            </div>
            <p className="text-sm tabular-nums text-muted-foreground">
              {`${formatMoney(pageData.summary.allocated)} − ${formatMoney(pageData.summary.spendableSpent)}`}
            </p>
            {pageData.snapshotMatchesLive ? (
              <p id="period-snapshot-status" className={stitchReports.periodStatus} role="status">
                {t('snapshotUpToDate')}
              </p>
            ) : (
              <>
                <p
                  id="period-snapshot-status"
                  className={stitchReports.incompleteNotice}
                  role="status"
                >
                  {t('snapshotOutOfDate')}
                </p>
                <table className={stitchReports.periodCompareTable}>
                  <thead>
                    <tr>
                      <td />
                      <th scope="col" className={stitchReports.periodCompareHead}>
                        {t('savedColumn')}
                      </th>
                      <th scope="col" className={cn(stitchReports.periodCompareHead, 'pl-3')}>
                        {t('liveColumn')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <CompareRow
                      label={t('spendLabel')}
                      stored={pageData.storedAmounts.spendableSpent}
                      live={pageData.liveAmounts.spendableSpent}
                      formatMoney={formatMoney}
                    />
                  </tbody>
                </table>
              </>
            )}
          </section>

          <TopExpensesRanking
            items={pageData.categoryRows}
            periodExpenses={pageData.storedAmounts.spendableSpent}
            hrefForCategory={(categoryKey) =>
              buildPeriodTransactionsHref({
                startDate: pageData.startDate,
                endDate: pageData.endDate,
                userId: pageData.userId,
                categoryKey,
              })
            }
          />

          {!pageData.summary.isOpen ? (
            <section className={stitchHome.scanSection} aria-labelledby="period-budgets-heading">
              <h2 id="period-budgets-heading" className={stitchHome.scanSectionTitle}>
                {t('budgetsTitle')}
              </h2>
              {pageData.budgetProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('budgetsEmpty')}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {pageData.budgetProgress.map((progress) => (
                    <BudgetCategoryCard
                      key={progress.id}
                      progress={progress}
                      categories={pageData.categories}
                      isSelected={false}
                      onPress={() => {
                        setBudgetEditId(progress.id);
                        setBudgetFormOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          <div className={stitchReports.periodActions}>
            {!pageData.summary.isOpen ? (
              <button
                type="button"
                className={stitchSurface.primaryCta}
                onClick={handleRecalculate}
                disabled={isRecalculating}
                aria-describedby="period-snapshot-status"
              >
                {isRecalculating ? t('recalculating') : t('recalculate')}
              </button>
            ) : null}
            <div className={stitchReports.periodActionGroup}>
              <Link href={transactionsHref} className={stitchReports.periodActionRow}>
                <span>{t('viewTransactions')}</span>
                <ChevronRight className={stitchReports.rankingChevron} aria-hidden />
              </Link>
              <button
                type="button"
                className={stitchReports.periodActionRow}
                onClick={() => setEditOpen(true)}
              >
                <span>{t('editDates')}</span>
                <ChevronRight className={stitchReports.rankingChevron} aria-hidden />
              </button>
              {!pageData.summary.isOpen ? (
                <button
                  type="button"
                  className={stitchReports.periodActionRow}
                  onClick={() => {
                    setBudgetEditId(null);
                    setBudgetFormOpen(true);
                  }}
                >
                  <span>{t('addBudget')}</span>
                  <ChevronRight className={stitchReports.rankingChevron} aria-hidden />
                </button>
              ) : null}
            </div>
            {pageData.summary.isOpen ? (
              <div className={stitchReports.periodDangerWrap}>
                {pageData.canRewind ? (
                  <button
                    type="button"
                    className={cn(stitchSurface.dangerButton, stitchReports.periodActionDanger)}
                    onClick={() => setDeleteOpen(true)}
                  >
                    {t('deleteAndReopen')}
                  </button>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('deleteDisabled')}</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </HomeDashboardMain>

      <EditClosingDateModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        userId={pageData.userId}
        editStart
        editEnd={!pageData.summary.isOpen}
        period={{
          id: pageData.periodId,
          start_date: pageData.startDate,
          end_date: pageData.summary.isOpen ? null : pageData.endDate,
        }}
      />

      {budgetFormOpen && !pageData.summary.isOpen ? (
        <BudgetFormModal
          isOpen
          onClose={() => {
            setBudgetFormOpen(false);
            setBudgetEditId(null);
          }}
          editId={budgetEditId}
          periodId={pageData.periodId}
          periodUserId={pageData.userId}
          periodBudgets={pageData.periodBudgets}
        />
      ) : null}

      <ConfirmationDialog
        isOpen={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleRewind}
        title={t('deleteConfirmTitleOpen')}
        message={t('deleteConfirmMessageOpen')}
        confirmText={t('deleteAndReopen')}
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}
