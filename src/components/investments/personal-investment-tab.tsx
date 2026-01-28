"use client";

import { MetricCard, MetricGrid } from "@/components/ui/layout";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import { useInvestmentHistory } from "@/features/investments/hooks/use-investment-history";
import { InvestmentHistoryChart } from "./investment-history-chart";
import { BenchmarkChart } from "./benchmark-chart";
import { InvestmentList } from "./investment-list";
import { investmentsStyles } from "@/features/investments/theme/investments-styles";

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
  indexData?: { datetime: string; close: string }[];
  currentIndex?: string;
}

export function PersonalInvestmentTab({ investments, summary, indexData, currentIndex = 'IVV' }: Readonly<PersonalInvestmentTabProps>) {
  const benchmarkAnchorId = 'benchmark-chart';

  const handleBenchmarkChange = (symbol: string) => {
    if (symbol && symbol !== currentIndex) {
      const nextSymbol = symbol.toUpperCase();
      const url = `?index=${encodeURIComponent(nextSymbol)}#${benchmarkAnchorId}`;
      window.location.assign(url);
    }
  };

  const calculatedHistory = useInvestmentHistory({
    investments,
    indexData,
    summary,
    currentIndex
  });

  const isPositiveReturn = summary.totalReturn >= 0;

  return (
    <div className={investmentsStyles.container}>
      <MetricGrid columns={4}>
        <MetricCard
          label="Valore Attuale"
          icon={<Wallet className="w-4 h-4" />}
          iconColor="accent"
          labelTone="variant"
          value={summary.totalCurrentValue}
          valueType="income"
          valueSize="xl"
          description={
            <span className={isPositiveReturn ? "text-emerald-600" : "text-rose-600"}>
              {isPositiveReturn ? '+' : ''}
              {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(summary.totalReturn)}
              {' '}
              ({summary.totalReturnPercent.toFixed(2)}%)
            </span>
          }
          variant="highlighted"
        />

        <MetricCard
          label="Investito"
          icon={<PiggyBank className="w-4 h-4" />}
          iconColor="accent"
          labelTone="variant"
          value={summary.totalInvested}
          valueType="neutral"
          valueSize="xl"
          description="Costo quote"
          variant="default"
        />

        <MetricCard
          label="Tasse Pagate"
          icon={<TrendingDown className="w-4 h-4" />}
          iconColor="destructive"
          labelTone="variant"
          value={summary.totalTaxPaid || 0}
          valueType="expense"
          valueSize="xl"
          description="Bollo + commissioni"
          variant="danger"
        />

        <MetricCard
          label="Totale Pagato"
          icon={<TrendingUp className="w-4 h-4" />}
          iconColor="muted"
          labelTone="variant"
          value={summary.totalPaid ?? 0}
          valueType="neutral"
          valueSize="xl"
          description="Investito + tasse"
          variant="default"
        />
      </MetricGrid>

      {/* Charts Row */}
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
