'use client';

import { useLocale } from 'next-intl';
import type { UserBudgetSummary } from '@/lib/types';
import { stitchBudgets } from '@/styles/home-design-foundation';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';

export interface BudgetsSummaryHeroProps {
  readonly summary: UserBudgetSummary;
  readonly labels: {
    readonly totalAvailable: string;
    readonly totalBudgeted: string;
    readonly totalSpent: string;
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
  const { main, rest } = splitCurrencyParts(availableFormatted);

  return (
    <section className={stitchBudgets.heroSection} aria-label={labels.totalAvailable}>
      <div className={stitchBudgets.heroInner}>
        <div className="flex flex-col gap-1">
          <span className={stitchBudgets.heroEyebrow}>{labels.totalAvailable}</span>
          <div className={stitchBudgets.heroAmountRow}>
            <span className={stitchBudgets.heroAmount}>{main}</span>
            {rest ? <span className={stitchBudgets.heroAmountCents}>{rest}</span> : null}
          </div>
        </div>
        <div className={stitchBudgets.heroMetricsRow}>
          <div>
            <p className={stitchBudgets.heroMetricLabel}>{labels.totalBudgeted}</p>
            <p className={stitchBudgets.heroMetricValue}>
              {formatCurrencyLocale(summary.totalBudget, locale)}
            </p>
          </div>
          <div>
            <p className={stitchBudgets.heroMetricLabel}>{labels.totalSpent}</p>
            <p className={stitchBudgets.heroMetricValue}>
              {formatCurrencyLocale(summary.totalSpent, locale)}
            </p>
          </div>
        </div>
      </div>
      <div className={stitchBudgets.heroGradientBar} aria-hidden />
    </section>
  );
}
