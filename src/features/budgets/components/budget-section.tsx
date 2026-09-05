'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { UserBudgetSummary } from '@/lib';
import { Amount } from '@/components/ui/primitives/amount';
import { BudgetProgressBar } from '@/features/budgets/components/budget-progress-bar';
import { deriveUserBudgetStatus } from '@/features/budgets/utils/budget-status';
import { formatDateShort } from '@/lib/utils/date-utils';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { initialsFromName } from '@/lib/utils/string-formatter';
import { stitchBudgets, stitchHome } from '@/styles/home-design-foundation';

interface BudgetSectionProps {
  budgetsByUser: Record<string, UserBudgetSummary>;
  selectedViewUserId?: string | undefined;
}

export const BudgetSection = ({ budgetsByUser, selectedViewUserId }: BudgetSectionProps) => {
  const t = useTranslations('HomeContent');
  const tHome = useTranslations('Budgets.HomeSection');
  const locale = useLocale();

  const budgetEntries = useMemo(() => {
    const all = Object.values(budgetsByUser);
    const filtered = selectedViewUserId
      ? all.filter((entry) => entry.user.id === selectedViewUserId)
      : all;
    return [...filtered]
      .filter((entry) => entry.budgets.length > 0)
      .sort((a, b) => b.overallPercentage - a.overallPercentage);
  }, [budgetsByUser, selectedViewUserId]);

  const showNames = budgetEntries.length > 1;

  return (
    <section aria-labelledby="home-budget-heading" className={stitchHome.scanSection}>
      <div className={stitchHome.scanSectionHeader}>
        <h2 id="home-budget-heading" className={stitchHome.scanSectionTitle}>
          {t('budgetTitle')}
        </h2>
        <Link href="/budgets" className={cn(stitchHome.viewAllLink, 'min-h-8 min-w-0 py-0')}>
          {t('budgetViewAll')}
        </Link>
      </div>

      {budgetEntries.length === 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-foreground">{t('budgetEmpty')}</p>
          <p className="text-sm text-muted-foreground">{t('budgetEmptyBody')}</p>
          <Link
            href="/budgets"
            className="inline-flex min-h-10 w-fit items-center text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
          >
            {t('budgetSet')}
          </Link>
        </div>
      ) : (
        <ul className={stitchHome.plainList}>
          {budgetEntries.map((entry) => {
            const status = deriveUserBudgetStatus(entry);
            const over = status === 'over';
            const periodLabel =
              entry.activePeriod && entry.periodStart
                ? `${formatDateShort(entry.periodStart, locale)} – ${
                    entry.periodEnd
                      ? formatDateShort(entry.periodEnd, locale)
                      : tHome('periodOngoing')
                  }`
                : tHome('periodOngoing');
            const title = showNames
              ? (entry.user.name ?? '')
              : over
                ? t('budgetOverLabel')
                : t('budgetLeft');

            return (
              <li key={entry.user.id}>
                <Link
                  href={`/budgets?user=${encodeURIComponent(entry.user.id)}`}
                  className={cn(
                    stitchHome.plainRow,
                    'flex-col items-stretch gap-1.5 py-2 focus-visible:rounded-md'
                  )}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      {showNames ? (
                        <span className={stitchHome.budgetRowAvatar} aria-hidden>
                          {initialsFromName(entry.user.name ?? '', {
                            emptyFallback: '?',
                            singleWord: 'two',
                          })}
                        </span>
                      ) : null}
                      <span className="min-w-0">
                        <span className={stitchHome.plainRowTitle}>{title}</span>
                        <span className={stitchHome.plainRowMeta}>{periodLabel}</span>
                      </span>
                    </span>
                    <Amount
                      type={entry.totalRemaining < 0 ? 'expense' : 'income'}
                      size="md"
                      emphasis="strong"
                    >
                      {entry.totalRemaining}
                    </Amount>
                  </span>
                  <BudgetProgressBar
                    percent={entry.overallPercentage}
                    label={tHome('progressAria', {
                      name: entry.user.name ?? '',
                      percent: Math.round(entry.overallPercentage),
                    })}
                    fillClassName={
                      over ? stitchBudgets.progressFillOver : stitchBudgets.progressFillPrimary
                    }
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default BudgetSection;
