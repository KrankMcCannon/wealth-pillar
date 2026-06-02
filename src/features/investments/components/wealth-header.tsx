'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { stitchInvestments } from '@/styles/home-design-foundation';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';
import { cn } from '@/lib/utils';

interface WealthHeaderProps {
  totalValue: number;
  trendAmount?: number;
  trendPercentage?: number;
}

function splitCurrencyParts(formatted: string): { main: string; rest: string } {
  const trimmed = formatted.trim();
  const match = /^([\s\S]*?)([,.]\d{2})\s*(\S*)$/.exec(trimmed);
  if (!match) return { main: trimmed, rest: '' };
  return { main: (match[1] ?? '').trim(), rest: `${match[2]} ${match[3] ?? ''}`.trim() };
}

export function WealthHeader({
  totalValue,
  trendAmount = 0,
  trendPercentage = 0,
}: Readonly<WealthHeaderProps>) {
  const locale = useLocale();
  const t = useTranslations('Investments.PersonalTab');

  const isPositive = trendAmount >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const totalFormatted = formatCurrencyLocale(totalValue, locale);
  const returnFormatted = formatCurrencyLocale(Math.abs(trendAmount), locale);
  const { main, rest } = splitCurrencyParts(totalFormatted);
  const percentLabel = `${Math.abs(trendPercentage).toFixed(2)}%`;
  const returnWithPercent = `${isPositive ? '+' : '-'}${returnFormatted} (${percentLabel})`;

  return (
    <section className={stitchInvestments.heroSection} aria-label={t('totalPortfolioValue')}>
      <div className={stitchInvestments.heroInner}>
        <div className={stitchInvestments.heroPrimaryColumn}>
          <span className={stitchInvestments.heroEyebrow}>{t('totalPortfolioValue')}</span>
          <div className={stitchInvestments.heroAmountRow}>
            <span className={stitchInvestments.heroAmount}>{main}</span>
            {rest ? <span className={stitchInvestments.heroAmountCents}>{rest}</span> : null}
          </div>
        </div>

        <div className={stitchInvestments.heroReturnColumn}>
          <span className={stitchInvestments.heroEyebrow}>{t('totalReturn')}</span>
          <div className={stitchInvestments.heroReturnValueRow}>
            <TrendIcon
              className={cn('size-3.5 shrink-0', isPositive ? 'text-income' : 'text-expense')}
              aria-hidden
            />
            <span
              className={
                isPositive
                  ? stitchInvestments.heroReturnValue
                  : stitchInvestments.heroReturnValueNegative
              }
            >
              {returnWithPercent}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
