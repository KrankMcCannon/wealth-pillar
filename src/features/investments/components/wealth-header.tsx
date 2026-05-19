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

  // Format total value
  const formattedTotal = format.number(totalValue, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Format trend amount
  const formattedTrendAmount = format.number(Math.abs(trendAmount), {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Format trend percentage
  const formattedTrendPercentage = format.number(Math.abs(trendPercentage) / 100, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <section
      className={
        investmentsStyles.card.root +
        ' ' +
        investmentsStyles.card.content +
        ' flex flex-col items-center justify-center text-center'
      }
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9fb0d7] mb-2">
        {t('totalPortfolioValue')}
      </p>
      <h1 className="text-4xl md:text-5xl font-bold text-[#8fb0ff] mb-4 tabular-nums tracking-[-0.02em]">
        {formattedTotal}
      </h1>

      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold ring-1 ring-inset ${
          isPositive
            ? 'bg-[#8fe2b4]/10 text-[#8fe2b4] ring-[#8fe2b4]/20'
            : 'bg-[#f0a6a6]/10 text-[#f0a6a6] ring-[#f0a6a6]/20'
        }`}
      >
        <TrendIcon className="w-3.5 h-3.5" />
        <span>
          {isPositive ? '+' : ''}
          {formattedTrendAmount} ({formattedTrendPercentage}) {t('today')}
        </span>
      </div>
    </section>
  );
}
