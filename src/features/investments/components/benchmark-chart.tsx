'use client';
import { useCurrency } from '@/providers/currency-provider';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ShareSelector } from './share-selector';
import { stitchInvestments } from '@/styles/home-design-foundation';
import { investmentsStyles } from '@/features/investments/theme/investments-styles';
import {
  investmentChartColors,
  rechartsAnimationOff,
  rechartsBenchmarkInitialDimension,
  rechartsTooltipContentStyle,
  rechartsTooltipItemStyle,
} from './investment-chart-theme';
import { formatBenchmarkAxisHead, formatLocaleMediumDate } from './chart-format-utils';
import { InvestmentChartContainer } from './investment-chart-container';

function rowDateKey(row: {
  datetime?: string | undefined;
  time?: string | undefined;
  date?: string | undefined;
}): string {
  return row.datetime ?? row.date ?? row.time ?? '';
}

interface BenchmarkChartProps {
  indexData?:
    | Array<{
        datetime?: string | undefined;
        time?: string | undefined;
        date?: string | undefined;
        close: string | number;
      }>
    | undefined;
  currentIndex: string;
  onBenchmarkChange: (symbol: string) => void;
  anchorId?: string | undefined;
}

export function BenchmarkChart({
  indexData,
  currentIndex,
  onBenchmarkChange,
  anchorId,
}: Readonly<BenchmarkChartProps>) {
  const { format: formatMoney } = useCurrency();
  const t = useTranslations('Investments.BenchmarkChart');
  const locale = useLocale();
  const titleId = useId();
  const summaryId = useId();
  const hasData = indexData && indexData.length > 0;
  const sortedData = hasData ? [...indexData].reverse() : [];
  const firstRow = sortedData[0];
  const lastRow = sortedData[sortedData.length - 1];
  const srSummary =
    hasData && firstRow && lastRow
      ? t('dataSummary', {
          count: sortedData.length,
          from: formatLocaleMediumDate(rowDateKey(firstRow), locale),
          to: formatLocaleMediumDate(rowDateKey(lastRow), locale),
          value: formatMoney(Number(lastRow.close) || 0, locale),
        })
      : null;

  return (
    <section
      role="region"
      aria-labelledby={titleId}
      aria-describedby={srSummary ? summaryId : undefined}
      className={stitchInvestments.chartCard}
      id={anchorId}
    >
      <div className={`${stitchInvestments.chartCardHeader} flex flex-col gap-3`}>
        <div className="min-w-0">
          <p id={titleId} className={stitchInvestments.chartCardTitle}>
            {t('title')}
          </p>
        </div>
        <ShareSelector value={currentIndex} onChange={onBenchmarkChange} />
      </div>
      <div className={stitchInvestments.chartCardContent}>
        {srSummary ? (
          <p id={summaryId} className="sr-only">
            {srSummary}
          </p>
        ) : null}
        {hasData ? (
          <InvestmentChartContainer className={investmentsStyles.charts.container} aria-hidden>
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={rechartsBenchmarkInitialDimension}
            >
              <LineChart data={sortedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={investmentChartColors.grid}
                />
                <XAxis
                  dataKey="datetime"
                  minTickGap={40}
                  tickFormatter={(val) => formatBenchmarkAxisHead(val)}
                  stroke={investmentChartColors.axis}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  stroke={investmentChartColors.axis}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const n = Number(value);
                    if (!Number.isFinite(n)) return '';
                    return formatMoney(n, locale, {
                      notation: 'compact',
                      maximumFractionDigits: 1,
                    });
                  }}
                  width={60}
                />
                <Tooltip
                  contentStyle={rechartsTooltipContentStyle()}
                  itemStyle={rechartsTooltipItemStyle}
                  formatter={(value) => formatMoney(Number(value) || 0, locale)}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke={investmentChartColors.lineSecondary}
                  dot={false}
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  {...rechartsAnimationOff}
                />
              </LineChart>
            </ResponsiveContainer>
          </InvestmentChartContainer>
        ) : (
          <div className={investmentsStyles.charts.fallback}>{t('fallback')}</div>
        )}
      </div>
    </section>
  );
}
