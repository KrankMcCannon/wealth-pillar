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
    readonly outOf: (total: string) => string;
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
    <section className={stitchBudgets.heroSection} aria-label={labels.totalAvailable}>
      <div className={stitchBudgets.heroInner}>
        <div className={stitchBudgets.heroTopRow}>
          <div className={stitchBudgets.heroPrimaryBlock}>
            <span className={stitchBudgets.heroEyebrow}>{labels.totalAvailable}</span>
            <div className={stitchBudgets.heroAmountRow}>
              <span className={stitchBudgets.heroAmount}>{main}</span>
              {rest ? <span className={stitchBudgets.heroAmountCents}>{rest}</span> : null}
              <span className={stitchBudgets.heroAmountBudget}>
                {labels.outOf(budgetFormatted)}
              </span>
            </div>
          </div>

          <div className={stitchBudgets.heroSpentBlock}>
            <span className={stitchBudgets.heroMetricLabel}>{labels.totalSpent}</span>
            <span className={stitchBudgets.heroSpentValue}>{spentFormatted}</span>
          </div>
        </div>
      </div>
      <div className={stitchBudgets.heroGradientBar} aria-hidden />
    </section>
  );
}
