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
    <section aria-labelledby="home-budget-heading" className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="home-budget-heading"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
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
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {budgetEntries.map((entry) => {
            const status = deriveUserBudgetStatus(entry);
            const over = status === 'over';
            const remainingLabel = over ? t('budgetOverLabel') : t('budgetLeft');
            const periodLabel =
              entry.activePeriod && entry.periodStart
                ? `${formatDateShort(entry.periodStart, locale)} – ${
                    entry.periodEnd
                      ? formatDateShort(entry.periodEnd, locale)
                      : tHome('periodOngoing')
                  }`
                : tHome('periodOngoing');

            return (
              <li key={entry.user.id}>
                <Link
                  href={`/budgets?user=${encodeURIComponent(entry.user.id)}`}
                  className="flex flex-col gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
                >
                  <p
                    className={
                      showNames
                        ? 'truncate text-sm text-muted-foreground'
                        : 'truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground'
                    }
                  >
                    {showNames ? entry.user.name : remainingLabel}
                  </p>
                  {showNames ? (
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {remainingLabel}
                    </p>
                  ) : null}
                  <Amount
                    type={entry.totalRemaining < 0 ? 'expense' : 'income'}
                    size="2xl"
                    emphasis="strong"
                    className="block text-[1.75rem] leading-none"
                  >
                    {entry.totalRemaining}
                  </Amount>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate text-xs text-muted-foreground">
                      <Amount type="expense" size="sm" className="inline">
                        {entry.totalSpent}
                      </Amount>
                      {` ${over ? t('overOfConnector') : t('spentOfConnector')} `}
                      <Amount type="neutral" size="sm" className="inline">
                        {entry.totalBudget}
                      </Amount>
                    </p>
                    <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {periodLabel}
                    </p>
                  </div>
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
