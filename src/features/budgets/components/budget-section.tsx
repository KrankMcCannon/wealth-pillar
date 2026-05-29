'use client';

import { useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { UserBudgetSummary } from '@/lib';
import { HomeSectionCard } from '@/components/home';
import { EmptyState } from '@/components/shared';
import { SectionHeader } from '@/components/layout';
import { Amount } from '@/components/ui/primitives/amount';
import {
  budgetStyles,
  getBudgetSectionProgressStyles,
  getBudgetSectionProgressBarStyle,
} from '@/features/budgets/theme/budget-styles';
import { useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { stitchHome, stitchSurface } from '@/styles/home-design-foundation';

interface BudgetSectionProps {
  budgetsByUser: Record<string, UserBudgetSummary>;
  selectedViewUserId?: string | undefined;
  headerLeading?: React.ReactNode;
}

/**
 * Budget section — home dashboard with stitchHome list rows.
 */
export const BudgetSection = ({
  budgetsByUser,
  selectedViewUserId,
  headerLeading,
}: BudgetSectionProps) => {
  const router = useRouter();
  const t = useTranslations('Budgets.HomeSection');
  const locale = useLocale();

  const goToBudgets = useCallback(() => router.push('/budgets'), [router]);
  const goToMemberBudgets = useCallback(
    (userId: string) => router.push(`/budgets?userId=${encodeURIComponent(userId)}`),
    [router]
  );

  const allBudgetEntries = useMemo(() => Object.values(budgetsByUser), [budgetsByUser]);

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

  if (budgetEntries.length === 0 || totalBudgetRows === 0) {
    return (
      <HomeSectionCard>
        <SectionHeader
          title={t('title')}
          subtitle={t('subtitle')}
          className="pb-1"
          titleClassName={stitchHome.sectionHeaderTitle}
          subtitleClassName={stitchHome.sectionHeaderSubtitle}
        />
        <EmptyState
          variant="surface"
          title={t('empty.title')}
          description={t('empty.description')}
          action={
            <button type="button" onClick={goToBudgets} className={stitchSurface.primaryCta}>
              {t('empty.createButton')}
            </button>
          }
        />
      </HomeSectionCard>
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

      <div className="flex flex-col gap-2">
        {sortedBudgetEntries.map((entry) => {
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
              className={cn(stitchHome.listRowInteractiveMinTouch, 'flex-col items-stretch gap-2')}
              onClick={() => goToMemberBudgets(entry.user.id)}
            >
              <div className="flex w-full items-center gap-3">
                <div className={stitchHome.budgetRowAvatar}>
                  {(entry.user.name ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className={stitchHome.rowTitle}>{entry.user.name ?? ''}</p>
                  <p className={stitchHome.rowMeta}>{periodLabel}</p>
                </div>
                <Amount
                  type="neutral"
                  size="lg"
                  emphasis="strong"
                  className="shrink-0 text-foreground"
                >
                  {entry.totalBudget}
                </Amount>
              </div>

              <p className="w-full text-left text-xs text-muted-foreground">
                {t('spentPrefix')}{' '}
                <Amount type="expense" size="sm" emphasis="subtle" className="inline">
                  {entry.totalSpent}
                </Amount>
                <span className="mx-1.5 text-border">·</span>
                {t('availablePrefix')}{' '}
                <Amount type="income" size="sm" emphasis="subtle" className="inline">
                  {entry.totalRemaining}
                </Amount>
              </p>

              <div className="flex w-full items-center gap-2">
                <div className="flex-1">
                  <div className={stitchHome.progressTrack}>
                    <div
                      className={`${budgetStyles.progress.barFillBase} ${progressClasses.bar}`}
                      style={getBudgetSectionProgressBarStyle(entry.overallPercentage)}
                    />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <div
                    className={`${budgetStyles.section.progressBadgeDot} ${progressClasses.dot}`}
                    aria-hidden
                  />
                  <span className={`text-sm font-semibold tabular-nums ${progressClasses.text}`}>
                    {Math.round(entry.overallPercentage)}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </HomeSectionCard>
  );
};

export default BudgetSection;
