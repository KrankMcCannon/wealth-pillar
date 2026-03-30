'use client';

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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ShareSelector } from './share-selector';
import { investmentsStyles } from '@/features/investments/theme/investments-styles';
import {
  investmentChartColors,
  rechartsInitialDimension,
  rechartsTooltipContentStyle,
  rechartsTooltipItemStyle,
} from './investment-chart-theme';
import { formatBenchmarkAxisHead, formatLocaleMediumDate } from './chart-format-utils';

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
          value: new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(
            Number(lastRow.close) || 0
          ),
        })
      : null;

  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      aria-describedby={srSummary ? summaryId : undefined}
      className={investmentsStyles.card.root}
      id={anchorId}
    >
      <CardHeader className="flex flex-col gap-2 px-3 pt-3 sm:gap-4">
        <div className="flex min-w-0 flex-col justify-between gap-2 md:flex-row md:items-center md:gap-4">
          <div className="min-w-0">
            <CardTitle id={titleId} className={investmentsStyles.card.title}>
              {t('title')}
            </CardTitle>
            <CardDescription
              className={cn(investmentsStyles.card.description, 'hidden sm:block')}
            >
              {t('description', { index: currentIndex })}
            </CardDescription>
          </div>
          <div className="w-full min-w-[200px] md:w-auto">
            <ShareSelector value={currentIndex} onChange={onBenchmarkChange} />
          </div>
        </div>
      </CardHeader>
      <CardContent className={investmentsStyles.card.content}>
        {srSummary ? (
          <p id={summaryId} className="sr-only">
            {srSummary}
          </p>
        ) : null}
        {hasData ? (
          <div className={investmentsStyles.charts.container} aria-hidden>
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={rechartsInitialDimension}
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
                    return new Intl.NumberFormat(locale, {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(n);
                  }}
                  width={60}
                />
                <Tooltip
                  contentStyle={rechartsTooltipContentStyle()}
                  itemStyle={rechartsTooltipItemStyle}
                  formatter={(value) =>
                    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(
                      Number(value) || 0
                    )
                  }
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke={investmentChartColors.lineSecondary}
                  dot={false}
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className={investmentsStyles.charts.fallback}>{t('fallback')}</div>
        )}
      </CardContent>
    </Card>
  );
}
