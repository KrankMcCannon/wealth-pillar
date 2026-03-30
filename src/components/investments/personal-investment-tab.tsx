'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { MetricCard } from '@/components/ui/layout';
import { Wallet } from 'lucide-react';
import { useInvestmentHistory } from '@/features/investments/hooks/use-investment-history';
import { InvestmentHistoryChart } from './investment-history-chart';
import { BenchmarkChart } from './benchmark-chart';
import { InvestmentList } from './investment-list';
import { investmentsStyles } from '@/features/investments/theme/investments-styles';

export interface Investment {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  shares_acquired: number;
  currentPrice?: number;
  currentValue?: number;
  initialValue?: number;
  currency: string;
  tax_paid?: number;
  totalPaid?: number;
  totalCost?: number;
  totalGain?: number;
  net_earn?: number;
  created_at: Date | string | null;
}

interface PersonalInvestmentTabProps {
  investments: Investment[];
  summary: {
    totalInvested: number;
    totalTaxPaid?: number;
    totalPaid?: number;
    totalCurrentValue: number;
    totalInitialValue?: number;
    totalReturn: number;
    totalReturnPercent: number;
  };
  indexData?:
    | Array<{
        datetime?: string | undefined;
        time?: string | undefined;
        date?: string | undefined;
        close: string | number;
      }>
    | undefined;
  currentIndex?: string | undefined;
}

export function PersonalInvestmentTab({
  investments,
  summary,
  indexData,
  currentIndex = 'IVV',
}: Readonly<PersonalInvestmentTabProps>) {
  const t = useTranslations('Investments.PersonalTab');
  const locale = useLocale();
  const benchmarkAnchorId = 'benchmark-chart';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleBenchmarkChange = (symbol: string) => {
    if (!symbol || symbol === currentIndex) return;
    const nextSymbol = symbol.toUpperCase();
    const params = new URLSearchParams(searchParams.toString());
    params.set('index', nextSymbol);
    const qs = params.toString();
    router.replace(`${pathname}?${qs}#${benchmarkAnchorId}`, { scroll: false });
  };

  const calculatedHistory = useInvestmentHistory({
    investments,
    indexData,
    summary,
    currentIndex,
  });

  const isPositiveReturn = summary.totalReturn >= 0;
  const formatEur = (value: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);

  return (
    <div className={investmentsStyles.container}>
      <section className="space-y-2 sm:space-y-3" aria-label={t('currentValueLabel')}>
        <MetricCard
          className="border-primary/15 p-4 shadow-sm sm:p-5 sm:shadow-md"
          label={t('currentValueLabel')}
          icon={<Wallet className="h-4 w-4" />}
          iconColor="accent"
          labelTone="variant"
          value={summary.totalCurrentValue}
          valueType="neutral"
          valueSize="xl"
          size="lg"
          description={
            <span className="block space-y-1">
              <span
                className={cn(
                  'block text-sm font-semibold',
                  isPositiveReturn ? 'text-success' : 'text-destructive'
                )}
              >
                {isPositiveReturn ? '+' : ''}
                {formatEur(summary.totalReturn)} ({summary.totalReturnPercent.toFixed(2)}%)
              </span>
              <span className="block text-[11px] leading-snug text-primary/60">
                {t('portfolioHeroHint')}
              </span>
            </span>
          }
          variant="highlighted"
          stats={[
            {
              label: t('investedLabel'),
              value: formatEur(summary.totalInvested),
              variant: 'muted',
            },
            {
              label: t('taxesPaidLabel'),
              value: formatEur(summary.totalTaxPaid || 0),
              variant: 'destructive',
            },
            {
              label: t('totalPaidLabel'),
              value: formatEur(summary.totalPaid ?? 0),
              variant: 'primary',
            },
          ]}
        />
      </section>

      <div className={investmentsStyles.charts.grid}>
        <InvestmentHistoryChart data={calculatedHistory} />

        <BenchmarkChart
          indexData={indexData}
          currentIndex={currentIndex}
          onBenchmarkChange={handleBenchmarkChange}
          anchorId={benchmarkAnchorId}
        />
      </div>

      <InvestmentList investments={investments} />
    </div>
  );
}
