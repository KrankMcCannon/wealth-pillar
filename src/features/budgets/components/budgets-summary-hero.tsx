'use client';

import { useLocale } from 'next-intl';
import type { UserBudgetSummary } from '@/lib/types';
import { stitchBudgets } from '@/styles/home-design-foundation';
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

function splitCurrencyParts(formatted: string): { main: string; rest: string } {
  const trimmed = formatted.trim();
  const match = /^([\s\S]*?)([,.]\d{2})\s*(\S*)$/.exec(trimmed);
  if (!match) return { main: trimmed, rest: '' };
  return { main: (match[1] ?? '').trim(), rest: `${match[2]} ${match[3] ?? ''}`.trim() };
}

export function BudgetsSummaryHero({ summary, labels }: Readonly<BudgetsSummaryHeroProps>) {
  const locale = useLocale();
  const availableFormatted = formatCurrencyLocale(summary.totalRemaining, locale);
  const budgetFormatted = formatCurrencyLocale(summary.totalBudget, locale);
  const spentFormatted = formatCurrencyLocale(summary.totalSpent, locale);
  const { main, rest } = splitCurrencyParts(availableFormatted);

  return (
    <section className={stitchBudgets.heroSection} aria-labelledby="budgets-hero-heading">
      <h2 id="budgets-hero-heading" className="sr-only">
        {labels.srHeading}
      </h2>
      <div className={stitchBudgets.heroInner}>
        <div className={stitchBudgets.heroPrimaryBlock}>
          <span className={stitchBudgets.heroEyebrow}>{labels.totalAvailable}</span>
          <div className={stitchBudgets.heroAmountRow}>
            <span className={stitchBudgets.heroAmount}>{main}</span>
            {rest ? <span className={stitchBudgets.heroAmountCents}>{rest}</span> : null}
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
      <div className={stitchBudgets.heroGradientBar} aria-hidden />
    </section>
  );
}
