'use client';

import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { investmentsStyles } from '@/features/investments/theme/investments-styles';
import {
  investmentChartColors,
  rechartsInitialDimension,
  rechartsTooltipContentStyle,
  rechartsTooltipItemStyle,
} from './investment-chart-theme';
import { formatHistoryAxisDate, formatLocaleMediumDate } from './chart-format-utils';

interface InvestmentHistoryChartProps {
  data: { date: string; value: number }[];
}

export function InvestmentHistoryChart({ data }: Readonly<InvestmentHistoryChartProps>) {
  const t = useTranslations('Investments.HistoryChart');
  const locale = useLocale();
  const titleId = useId();
  const summaryId = useId();
  const hasData = data && data.length > 0;
  const firstPoint = hasData ? data[0] : undefined;
  const lastPoint = hasData ? data[data.length - 1] : undefined;
  const srSummary =
    hasData && firstPoint && lastPoint
      ? t('dataSummary', {
          count: data.length,
          from: formatLocaleMediumDate(firstPoint.date, locale),
          to: formatLocaleMediumDate(lastPoint.date, locale),
          value: new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(
            lastPoint.value
          ),
        })
      : null;

  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      aria-describedby={srSummary ? summaryId : undefined}
      className={investmentsStyles.card.root}
    >
      <CardHeader className={investmentsStyles.card.header}>
        <CardTitle id={titleId} className={investmentsStyles.card.title}>
          {t('title')}
        </CardTitle>
        <CardDescription
          className={cn(investmentsStyles.card.description, 'hidden sm:block')}
        >
          {t('description')}
        </CardDescription>
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
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={investmentChartColors.linePrimary}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={investmentChartColors.linePrimary}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={investmentChartColors.grid}
                />
                <XAxis
                  dataKey="date"
                  stroke={investmentChartColors.axis}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatHistoryAxisDate(val)}
                  minTickGap={30}
                  dy={10}
                />
                <YAxis
                  stroke={investmentChartColors.axis}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const n = Number(value);
                    if (!Number.isFinite(n)) return '';
                    return `${new Intl.NumberFormat(locale, {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(n)}€`;
                  }}
                  width={60}
                />
                <Tooltip
                  contentStyle={rechartsTooltipContentStyle()}
                  itemStyle={rechartsTooltipItemStyle}
                  formatter={(value) => [
                    new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(
                      Number(value) || 0
                    ),
                    t('valueSeriesLabel'),
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={investmentChartColors.linePrimary}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorHistory)"
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className={investmentsStyles.charts.fallback}>{t('fallback')}</div>
        )}
      </CardContent>
    </Card>
  );
}
