import { TrendingUp, TrendingDown } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { investmentsStyles } from '@/features/investments';

interface WealthHeaderProps {
  totalValue: number;
  trendAmount?: number;
  trendPercentage?: number;
  currency?: string;
}

export function WealthHeader({
  totalValue,
  trendAmount = 0,
  trendPercentage = 0,
  currency = 'EUR',
}: WealthHeaderProps) {
  const format = useFormatter();
  const t = useTranslations('Investments.PersonalTab');

  const isPositive = trendAmount >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const formattedTotal = format.number(totalValue, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedTrendAmount = format.number(Math.abs(trendAmount), {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedTrendPercentage = format.number(Math.abs(trendPercentage) / 100, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <section
      className={`${investmentsStyles.card.root} ${investmentsStyles.card.content} flex flex-col items-center justify-center text-center`}
    >
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {t('totalPortfolioValue')}
      </p>
      <h1 className="mb-4 text-4xl font-bold tabular-nums tracking-[-0.02em] text-primary">
        {formattedTotal}
      </h1>

      <div
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ring-1 ring-inset ${
          isPositive
            ? 'bg-income/10 text-income ring-income/20'
            : 'bg-expense/10 text-expense ring-expense/20'
        }`}
      >
        <TrendIcon className="size-3.5" />
        <span>
          {isPositive ? '+' : ''}
          {formattedTrendAmount} ({formattedTrendPercentage}) {t('today')}
        </span>
      </div>
    </section>
  );
}
