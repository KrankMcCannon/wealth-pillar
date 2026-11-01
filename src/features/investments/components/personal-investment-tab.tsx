'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/routing';
import { InvestmentsScreenList } from './investments-screen-list';
import { WealthHeader } from './wealth-header';
import { useTranslations } from 'next-intl';
import type { AssetAllocationSlice } from '@/server/use-cases/investments/investment.use-cases';
import type { InvestmentListItem } from '@/server/use-cases/investments/investment.types';
import { buildAllocationChartData } from '@/features/investments/utils/allocation-chart-data';
import { stitchInvestments } from '@/styles/home-design-foundation';
import { SectionDisclosure } from '@/components/shared/section-disclosure';
import { investmentsStyles } from '@/features/investments/theme/investments-styles';

function ChartSlotFallback() {
  return (
    <div className={stitchInvestments.chartCard}>
      <div className={investmentsStyles.charts.fallback} aria-busy="true" />
    </div>
  );
}

const AssetAllocationCard = dynamic(
  () => import('./asset-allocation-card').then((m) => m.AssetAllocationCard),
  { ssr: false, loading: ChartSlotFallback }
);
const InvestmentHistoryChart = dynamic(
  () => import('./investment-history-chart').then((m) => m.InvestmentHistoryChart),
  { ssr: false, loading: ChartSlotFallback }
);
const BenchmarkChart = dynamic(() => import('./benchmark-chart').then((m) => m.BenchmarkChart), {
  ssr: false,
  loading: ChartSlotFallback,
});

export type Investment = InvestmentListItem;

interface PersonalInvestmentTabProps {
  summary: {
    totalInvested: number;
    totalTaxPaid?: number;
    totalPaid?: number;
    totalCurrentValue: number | null;
    totalInitialValue?: number | null;
    totalReturn: number | null;
    totalReturnPercent: number | null;
  };
  assetAllocation: AssetAllocationSlice[];
  portfolioHistory: { date: string; value: number }[];
  marketDataUpdatedAt: string | null;
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
}

export function PersonalInvestmentTab({
  summary,
  assetAllocation,
  portfolioHistory,
  marketDataUpdatedAt,
  indexData,
  currentIndex = 'IVV',
  holdings,
}: Readonly<PersonalInvestmentTabProps>) {
  const benchmarkAnchorId = 'benchmark-chart';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('Investments.PersonalTab');
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const handleBenchmarkChange = (symbol: string) => {
    if (!symbol || symbol === currentIndex) return;
    const nextSymbol = symbol.toUpperCase();
    const params = new URLSearchParams(searchParams.toString());
    params.set('index', nextSymbol);
    const qs = params.toString();
    router.replace(`${pathname}?${qs}#${benchmarkAnchorId}`, { scroll: false });
  };

  const allocationData = buildAllocationChartData(assetAllocation, t('fallback.others'));
  const hasAnalytics =
    allocationData.length > 0 || portfolioHistory.length > 0 || (indexData?.length ?? 0) > 0;

  return (
    <>
      {holdings.length > 0 ? (
        <WealthHeader
          totalValue={summary.totalCurrentValue}
          trendAmount={summary.totalReturn}
          trendPercentage={summary.totalReturnPercent}
          marketDataUpdatedAt={marketDataUpdatedAt}
        />
      ) : null}

      <InvestmentsScreenList holdings={holdings} />

      {hasAnalytics ? (
        <SectionDisclosure
          label={t('analyticsTitle')}
          className="border-t border-border/40"
          open={analyticsOpen}
          onToggle={(event) => setAnalyticsOpen(event.currentTarget.open)}
        >
          {analyticsOpen ? (
            <div className="mt-4 flex min-w-0 flex-col gap-4">
              {allocationData.length > 0 ? <AssetAllocationCard data={allocationData} /> : null}

              <InvestmentHistoryChart data={portfolioHistory} />

              <BenchmarkChart
                indexData={indexData}
                currentIndex={currentIndex}
                onBenchmarkChange={handleBenchmarkChange}
                anchorId={benchmarkAnchorId}
              />
            </div>
          ) : null}
        </SectionDisclosure>
      ) : null}
    </>
  );
}
