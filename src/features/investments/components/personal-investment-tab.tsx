'use client';

import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/routing';
import { InvestmentHistoryChart } from './investment-history-chart';
import { BenchmarkChart } from './benchmark-chart';
import { InvestmentsScreenList } from './investments-screen-list';
import { stitchInvestments } from '@/styles/home-design-foundation';
import { WealthHeader } from './wealth-header';
import { AssetAllocationCard } from './asset-allocation-card';
import { useTranslations } from 'next-intl';
import type { AssetAllocationSlice } from '@/server/use-cases/investments/investment.use-cases';
import type { InvestmentListItem } from '@/server/use-cases/investments/investment.types';
import { buildAllocationChartData } from '@/features/investments/utils/allocation-chart-data';

export type Investment = InvestmentListItem;

interface PersonalInvestmentTabProps {
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
  holdings: InvestmentListItem[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

export function PersonalInvestmentTab({
  summary,
  assetAllocation,
  portfolioHistory,
  indexData,
  currentIndex = 'IVV',
  holdings,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: Readonly<PersonalInvestmentTabProps>) {
  const benchmarkAnchorId = 'benchmark-chart';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('Investments.PersonalTab');

  const handleBenchmarkChange = (symbol: string) => {
    if (!symbol || symbol === currentIndex) return;
    const nextSymbol = symbol.toUpperCase();
    const params = new URLSearchParams(searchParams.toString());
    params.set('index', nextSymbol);
    const qs = params.toString();
    router.replace(`${pathname}?${qs}#${benchmarkAnchorId}`, { scroll: false });
  };

  const allocationData = buildAllocationChartData(assetAllocation, t('fallback.others'));

  return (
    <div className={stitchInvestments.mainStack}>
      <WealthHeader
        totalValue={summary.totalCurrentValue}
        trendAmount={summary.totalReturn}
        trendPercentage={summary.totalReturnPercent}
      />

      <AssetAllocationCard data={allocationData} />

      <div className="flex min-w-0 flex-col gap-4">
        <InvestmentHistoryChart data={portfolioHistory} />

        <BenchmarkChart
          indexData={indexData}
          currentIndex={currentIndex}
          onBenchmarkChange={handleBenchmarkChange}
          anchorId={benchmarkAnchorId}
        />
      </div>

      <InvestmentsScreenList
        holdings={holdings}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={onLoadMore}
      />
    </div>
  );
}
