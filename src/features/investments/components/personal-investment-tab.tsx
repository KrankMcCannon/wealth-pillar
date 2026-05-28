'use client';

import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/routing';
import { InvestmentHistoryChart } from './investment-history-chart';
import { BenchmarkChart } from './benchmark-chart';
import { InvestmentList } from './investment-list';
import { investmentsStyles } from '@/features/investments/theme/investments-styles';
import { WealthHeader } from './wealth-header';
import { AssetAllocationCard } from './asset-allocation-card';
import { useTranslations } from 'next-intl';
import type { AssetAllocationSlice } from '@/server/use-cases/investments/investment.use-cases';

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
  assetAllocation: AssetAllocationSlice[];
  portfolioHistory: { date: string; value: number }[];
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
  assetAllocation,
  portfolioHistory,
  indexData,
  currentIndex = 'IVV',
}: Readonly<PersonalInvestmentTabProps>) {
  const benchmarkAnchorId = 'benchmark-chart';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('Investments');

  const handleBenchmarkChange = (symbol: string) => {
    if (!symbol || symbol === currentIndex) return;
    const nextSymbol = symbol.toUpperCase();
    const params = new URLSearchParams(searchParams.toString());
    params.set('index', nextSymbol);
    const qs = params.toString();
    router.replace(`${pathname}?${qs}#${benchmarkAnchorId}`, { scroll: false });
  };

  const sortedGroups = assetAllocation
    .filter((item) => item.value > 0)
    .map((item) => ({ name: item.symbol, value: item.value }))
    .sort((a, b) => b.value - a.value);

  const top4 = sortedGroups.slice(0, 4);
  const others = sortedGroups.slice(4);
  const othersTotal = others.reduce((sum, item) => sum + item.value, 0);

  const allocationData = top4.map((item, index) => ({
    ...item,
    color: [
      'var(--color-primary)',
      'var(--color-income)',
      'var(--color-primary)',
      'var(--color-ring)',
    ][index] as string,
  }));

  if (othersTotal > 0) {
    allocationData.push({
      name: t('fallback.others'),
      value: othersTotal,
      color: 'var(--color-primary)',
    });
  }

  return (
    <div className={investmentsStyles.container}>
      <WealthHeader
        totalValue={summary.totalCurrentValue}
        trendAmount={summary.totalReturn}
        trendPercentage={summary.totalReturnPercent}
        currency="EUR"
      />

      <div className="grid grid-cols-1 gap-6">
        <AssetAllocationCard data={allocationData} />
      </div>

      <div className={investmentsStyles.charts.grid}>
        <InvestmentHistoryChart data={portfolioHistory} />

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
