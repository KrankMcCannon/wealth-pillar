'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { reportsStyles } from '@/features/reports/theme/reports-styles';
import { useTranslations } from 'next-intl';

interface TimeTrendsChartProps {
  data: { date: string; income: number; expense: number }[];
}

/**
 * Intelligently aggregate data based on the number of data points:
 *  - ≤ 14 items → show daily (no aggregation)
 *  - > 14 items → aggregate by month
 */
function smartAggregate(data: { date: string; income: number; expense: number }[]) {
  const shortMonthNames = [
    'Gen',
    'Feb',
    'Mar',
    'Apr',
    'Mag',
    'Giu',
    'Lug',
    'Ago',
    'Set',
    'Ott',
    'Nov',
    'Dic',
  ];

  // For short ranges (7d, ~14d), show daily bars
  if (data.length <= 14) {
    return data
      .map((item) => {
        const parsed = new Date(item.date);
        const label = !isNaN(parsed.getTime())
          ? `${parsed.getDate()} ${shortMonthNames[parsed.getMonth()]}`
          : item.date;
        return {
          label,
          income: item.income,
          expense: item.expense,
          sortKey: parsed.getTime(),
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  }

  // For longer ranges, aggregate by month
  const monthMap = new Map<
    string,
    { label: string; income: number; expense: number; sortKey: number }
  >();

  for (const item of data) {
    const parsed = new Date(item.date);
    if (isNaN(parsed.getTime())) continue;

    const year = parsed.getFullYear();
    const month = parsed.getMonth();
    const key = `${year}-${month}`;
    const label = `${shortMonthNames[month]} ${year}`;
    const sortKey = year * 100 + month;

    const existing = monthMap.get(key);
    if (existing) {
      existing.income += item.income;
      existing.expense += item.expense;
    } else {
      monthMap.set(key, { label, income: item.income, expense: item.expense, sortKey });
    }
  }

  return Array.from(monthMap.values()).sort((a, b) => a.sortKey - b.sortKey);
}

export function TimeTrendsChart({ data }: TimeTrendsChartProps) {
  const t = useTranslations('Reports.Charts');

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return smartAggregate(data);
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className={reportsStyles.charts.container}>
        <div className="flex h-[250px] sm:h-[300px] items-center justify-center text-muted-foreground text-sm">
          No data available
        </div>
      </div>
    );
  }

  const formatYAxisValue = (value: number) => {
    if (value >= 1000) return `€${(value / 1000).toFixed(1)}k`;
    return `€${value}`;
  };

  return (
    <div className={reportsStyles.charts.container}>
      <div className={reportsStyles.charts.header}>
        <div>
          <h3 className={reportsStyles.charts.title}>{t('timeTrendsTitle')}</h3>
          <p className={reportsStyles.charts.subtitle}>{t('timeTrendsSubtitle')}</p>
        </div>
      </div>

      <div className={reportsStyles.charts.chartArea}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
            barCategoryGap="20%"
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ dy: 8 }}
              height={45}
              interval={0}
              angle={chartData.length > 6 ? -30 : 0}
              textAnchor={chartData.length > 6 ? 'end' : 'middle'}
            />
            <YAxis
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxisValue}
              width={55}
              tick={{ dx: -4 }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className={reportsStyles.charts.tooltip}>
                      <p className="mb-2 font-medium text-sm">{String(label)}</p>
                      {payload.map((entry) => (
                        <div key={String(entry.name)} className="flex items-center gap-2 text-sm">
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: String(entry.color) }}
                          />
                          <span className="text-muted-foreground">
                            {entry.name === 'income' ? t('income') : t('expense')}:
                          </span>
                          <span className="font-bold">{formatCurrency(entry.value as number)}</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="income"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              name="income"
              animationDuration={1000}
            />
            <Bar
              dataKey="expense"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              name="expense"
              animationDuration={1000}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={reportsStyles.charts.legend}>
        <div className={reportsStyles.charts.legendItem}>
          <div className={`${reportsStyles.charts.legendDot} bg-emerald-500`}></div>
          {t('income')}
        </div>
        <div className={reportsStyles.charts.legendItem}>
          <div className={`${reportsStyles.charts.legendDot} bg-red-500`}></div>
          {t('expense')}
        </div>
      </div>
    </div>
  );
}
