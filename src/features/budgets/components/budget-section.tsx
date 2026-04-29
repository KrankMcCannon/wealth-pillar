'use client';

import { useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { UserBudgetSummary } from '@/lib';
import { BudgetSectionSkeleton } from '@/features/dashboard';
import { HomeSectionCard } from '@/components/home';
import { SectionHeader } from '@/components/layout';
import { PageSection } from '@/components/ui/layout';
import { formatCurrency } from '@/lib/utils/currency-formatter';
import {
  budgetStyles,
  getBudgetSectionProgressStyles,
  getBudgetGroupCardStyle,
  getBudgetSectionProgressBarStyle,
} from '@/styles/system';
import { useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { stitchHome } from '@/styles/home-design-foundation';

interface BudgetSectionProps {
  budgetsByUser: Record<string, UserBudgetSummary>;
  selectedViewUserId?: string | undefined;
  isLoading?: boolean;
  headerLeading?: React.ReactNode;
}

/**
 * Budget section — visualizzazione Home con token `stitchHome` condivisi.
 */
export const BudgetSection = ({
  budgetsByUser,
  selectedViewUserId,
  isLoading,
  headerLeading,
}: BudgetSectionProps) => {
  const router = useRouter();
  const t = useTranslations('Budgets.HomeSection');
  const locale = useLocale();

  const goToBudgets = useCallback(() => router.push('/budgets'), [router]);
  const goToBudgetSummary = useCallback(
    (userId: string) => router.push(`/budgets/summary?userId=${userId}`),
    [router]
  );

  const allBudgetEntries = useMemo(
    () => Object.values(budgetsByUser),
    [budgetsByUser]
  );

  const budgetEntries = useMemo(
    () =>
      selectedViewUserId
        ? allBudgetEntries.filter((entry) => entry.user.id === selectedViewUserId)
        : allBudgetEntries,
    [allBudgetEntries, selectedViewUserId]
  );

  const totalBudgetRows = useMemo(
    () => budgetEntries.reduce((sum, entry) => sum + entry.budgets.length, 0),
    [budgetEntries]
  );

  const sortedBudgetEntries = useMemo(
    () => [...budgetEntries].sort((a, b) => b.totalBudget - a.totalBudget),
    [budgetEntries]
  );

  const isInitialLoading = isLoading && budgetEntries.length === 0;

  if (isInitialLoading) {
    return <BudgetSectionSkeleton />;
  }

  if (budgetEntries.length === 0 || totalBudgetRows === 0) {
    return (
      <PageSection className={budgetStyles.section.container}>
        <SectionHeader
          title={t('title')}
          subtitle={t('subtitle')}
          className="mb-4 border-b border-border/40 pb-4 dark:border-border/35"
        />
        <div className={budgetStyles.section.emptyContainer}>
          <div className={budgetStyles.section.emptyIconWrap}>
            <div className={budgetStyles.section.emptyIconInner}>
              <span className={budgetStyles.section.emptyIconText}>€</span>
            </div>
          </div>
          <h3 className={budgetStyles.section.emptyTitle}>{t('empty.title')}</h3>
          <p className={budgetStyles.section.emptyDescription}>{t('empty.description')}</p>
          <button type="button" onClick={goToBudgets} className={budgetStyles.section.emptyButton}>
            {t('empty.createButton')}
          </button>
        </div>
      </PageSection>
    );
  }

  return (
    <HomeSectionCard>
      <SectionHeader
        title={t('title')}
        subtitle={t('multiUsersSubtitle', { count: budgetEntries.length })}
        leading={headerLeading}
        className={cn('pb-1', headerLeading && 'items-start')}
        titleClassName={stitchHome.sectionHeaderTitle}
        subtitleClassName={stitchHome.sectionHeaderSubtitle}
      />

      <div className={budgetStyles.transactions.container}>
        <div className="space-y-3">
          {sortedBudgetEntries.map((entry, index) => {
            const progressClasses = getBudgetSectionProgressStyles(entry.overallPercentage);
            const periodLabel =
              entry.activePeriod && entry.periodStart
                ? `${new Date(entry.periodStart).toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'short',
                  })} - ${
                    entry.periodEnd
                      ? new Date(entry.periodEnd).toLocaleDateString(locale, {
                          day: 'numeric',
                          month: 'short',
                        })
                      : t('periodOngoing')
                  }`
                : t('periodOngoing');

            return (
              <button
                key={entry.user.id}
                type="button"
                className={stitchHome.budgetUserCard}
                style={getBudgetGroupCardStyle(index)}
                onClick={() => goToBudgetSummary(entry.user.id)}
              >
                <p className={stitchHome.budgetEyebrow}>{t('monthlyBudgetEyebrow')}</p>

                <div className="flex items-center gap-3">
                  <div className={stitchHome.budgetUserAvatar}>
                    {(entry.user.name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={stitchHome.budgetUserName}>{entry.user.name ?? ''}</p>
                    <p className={stitchHome.budgetPeriod}>{periodLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className={stitchHome.budgetTotal}>{formatCurrency(entry.totalBudget)}</p>
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                  <p className={stitchHome.budgetMetricLabel}>
                    {t('spentPrefix')}{' '}
                    <span className={`font-semibold ${stitchHome.amountExpense}`}>
                      {formatCurrency(entry.totalSpent)}
                    </span>
                  </p>
                  <p className={`text-right ${stitchHome.budgetMetricLabel}`}>
                    {t('availablePrefix')}{' '}
                    <span className={`font-semibold ${stitchHome.amountIncome}`}>
                      {formatCurrency(entry.totalRemaining)}
                    </span>
                  </p>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex-1">
                    <div className={stitchHome.progressTrack}>
                      <div
                        className={`${budgetStyles.progress.barFillBase} ${progressClasses.bar}`}
                        style={getBudgetSectionProgressBarStyle(entry.overallPercentage)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`${budgetStyles.section.progressBadgeDot} ${progressClasses.dot}`}
                    />
                    <span className={`text-base font-semibold ${progressClasses.text}`}>
                      {Math.round(entry.overallPercentage)}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </HomeSectionCard>
  );
};

export default BudgetSection;
