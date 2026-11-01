'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { stitchInvestments } from '@/styles/home-design-foundation';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';
import { cn } from '@/lib/utils';

interface WealthHeaderProps {
  totalValue: number | null;
  trendAmount?: number | null;
  trendPercentage?: number | null;
  marketDataUpdatedAt: string | null;
}

function formatMarketFreshness(value: string | null | undefined, locale: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function WealthHeader({
  totalValue,
  trendAmount = 0,
  trendPercentage = 0,
  marketDataUpdatedAt,
}: Readonly<WealthHeaderProps>) {
  const locale = useLocale();
  const t = useTranslations('Investments.PersonalTab');

  const hasReturn = totalValue != null && trendAmount != null && trendPercentage != null;
  const isPositive = (trendAmount ?? 0) >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const totalFormatted =
    totalValue == null ? t('valuationUnavailable') : formatCurrencyLocale(totalValue, locale);
  const returnFormatted = formatCurrencyLocale(Math.abs(trendAmount ?? 0), locale);
  const percentLabel = `${Math.abs(trendPercentage ?? 0).toFixed(2)}%`;
  const returnWithPercent = `${isPositive ? '+' : '-'}${returnFormatted} (${percentLabel})`;
  const freshness = formatMarketFreshness(marketDataUpdatedAt, locale);

  return (
    <section className={stitchInvestments.heroSection} aria-label={t('totalPortfolioValue')}>
      <div className={stitchInvestments.heroInner}>
        <div className={stitchInvestments.heroPrimaryColumn}>
          <span className={stitchInvestments.heroEyebrow}>{t('totalPortfolioValue')}</span>
          <div className={stitchInvestments.heroAmountRow}>
            <span
              className={
                totalValue == null ? 'text-lg text-muted-foreground' : stitchInvestments.heroAmount
              }
            >
              {totalFormatted}
            </span>
          </div>
        </div>

        <div className={stitchInvestments.heroReturnColumn}>
          <span className={stitchInvestments.heroEyebrow}>{t('totalReturn')}</span>
          <div className={stitchInvestments.heroReturnValueRow}>
            {hasReturn ? (
              <TrendIcon
                className={cn('size-3.5 shrink-0', isPositive ? 'text-income' : 'text-expense')}
                aria-hidden
              />
            ) : null}
            <span
              className={
                !hasReturn
                  ? 'text-muted-foreground'
                  : isPositive
                    ? stitchInvestments.heroReturnValue
                    : stitchInvestments.heroReturnValueNegative
              }
            >
              {hasReturn ? returnWithPercent : t('valuationUnavailable')}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {freshness
          ? t('marketDataFreshness', { date: freshness })
          : t('marketDataFreshnessUnknown')}
      </p>
    </section>
  );
}
