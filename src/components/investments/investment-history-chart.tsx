'use client';

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
import { investmentsStyles } from '@/features/investments/theme/investments-styles';
import {
  investmentChartColors,
  rechartsTooltipContentStyle,
  rechartsTooltipItemStyle,
} from './investment-chart-theme';

interface InvestmentHistoryChartProps {
  data: { date: string; value: number }[];
}

export function InvestmentHistoryChart({ data }: Readonly<InvestmentHistoryChartProps>) {
  const t = useTranslations('Investments.HistoryChart');
  const locale = useLocale();
  const hasData = data && data.length > 0;

  return (
    <Card className={investmentsStyles.card.root}>
      <CardHeader className={investmentsStyles.card.header}>
        <CardTitle className={investmentsStyles.card.title}>{t('title')}</CardTitle>
        <CardDescription className={investmentsStyles.card.description}>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent className={investmentsStyles.card.content}>
        {hasData ? (
          <div className={investmentsStyles.charts.container}>
            <ResponsiveContainer width="100%" height="100%">
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
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  minTickGap={30}
                  dy={10}
                />
                <YAxis
                  stroke={investmentChartColors.axis}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    `${new Intl.NumberFormat(locale, {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(value)}€`
                  }
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
