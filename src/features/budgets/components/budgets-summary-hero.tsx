'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { UserBudgetSummary } from '@/lib/types';
import { stitchBudgets } from '@/styles/home-design-foundation';
import { cn } from '@/lib/utils';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';

export interface BudgetsSummaryHeroProps {
  readonly summary: UserBudgetSummary;
  readonly labels: {
    readonly totalAvailable: string;
    readonly totalSpent: string;
    readonly totalAssigned: string;
    readonly srHeading: string;
  };
}

export function BudgetsSummaryHero({ summary, labels }: Readonly<BudgetsSummaryHeroProps>) {
  const locale = useLocale();
  const ux = useTranslations('Budgets.UX');
  const availableFormatted = formatCurrencyLocale(summary.totalRemaining, locale);
  const budgetFormatted = formatCurrencyLocale(summary.totalBudget, locale);
  const spentFormatted = formatCurrencyLocale(summary.totalSpent, locale);

  return (
    <section className={stitchBudgets.heroSection} aria-labelledby="budgets-hero-heading">
      <h2 id="budgets-hero-heading" className="sr-only">
        {labels.srHeading}
      </h2>
      <div className={stitchBudgets.heroInner}>
        <div className={stitchBudgets.heroPrimaryBlock}>
          <span className={stitchBudgets.heroEyebrow}>
            {summary.totalRemaining < 0
              ? ux('overLabel')
              : summary.totalRemaining === 0
                ? ux('reached')
                : labels.totalAvailable}
          </span>
          <div className={stitchBudgets.heroAmountRow}>
            <span
              className={cn(
                stitchBudgets.heroAmount,
                summary.totalRemaining < 0 ? 'text-expense' : 'text-foreground'
              )}
            >
              {availableFormatted}
            </span>
          </div>
        </div>

        <div className={stitchBudgets.heroStatMiniRow}>
          <p className="text-sm text-muted-foreground">
            <span className="text-expense">{spentFormatted}</span>
            {` ${labels.totalSpent} · `}
            {budgetFormatted}
            {` ${labels.totalAssigned}`}
          </p>
        </div>
      </div>
    </section>
  );
}
