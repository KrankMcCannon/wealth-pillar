'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import { EmptyState } from '@/components/shared';

interface TimeTrendsChartProps {
  data: { date: string; income: number; expense: number }[];
}

function smartAggregate(data: { date: string; income: number; expense: number }[], locale: string) {
  const monthAbbr = (date: Date) =>
    new Intl.DateTimeFormat(locale, { month: 'short' }).format(date);

  if (data.length <= 14) {
    return data
      .map((item) => {
        const parsed = new Date(item.date);
        const label = !isNaN(parsed.getTime())
          ? `${parsed.getDate()} ${monthAbbr(parsed)}`
          : item.date;
        return { label, income: item.income, expense: item.expense, sortKey: parsed.getTime() };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  }

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
    const label = `${monthAbbr(new Date(year, month))} ${year}`;
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
  const locale = useLocale();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return smartAggregate(data, locale);
  }, [data, locale]);

  const formatYAxisValue = useMemo(
    () => (value: number) =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value),
    [locale]
  );

  if (chartData.length === 0) {
    return (
      <div className="bg-card border border-primary/15 rounded-xl p-4 sm:p-6">
        <EmptyState title={t('noData')} />
      </div>
    );
  }

  return (
    <div className="bg-card border border-primary/15 rounded-xl p-4 sm:p-6">
      <div className="w-full h-[250px] sm:h-[300px] md:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
            barCategoryGap="20%"
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="var(--color-muted-foreground)"
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
              stroke="var(--color-muted-foreground)"
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
                    <div
                      role="tooltip"
                      className="bg-card border border-primary/20 rounded-xl p-3 text-sm shadow-lg"
                    >
                      <p className="mb-2 font-semibold text-primary">{String(label)}</p>
                      {payload.map((entry) => (
                        <div key={String(entry.name)} className="flex items-center gap-2 text-sm">
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: String(entry.color) }}
                          />
                          <span className="text-muted-foreground">
                            {entry.name === 'income' ? t('income') : t('expense')}:
                          </span>
                          <span className="font-bold text-primary">
                            {formatCurrency(entry.value as number)}
                          </span>
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
              fill="var(--color-success)"
              radius={[4, 4, 0, 0]}
              name="income"
              animationDuration={600}
            />
            <Bar
              dataKey="expense"
              fill="var(--color-destructive)"
              radius={[4, 4, 0, 0]}
              name="expense"
              animationDuration={600}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul
        className="mt-3 flex flex-wrap gap-x-5 gap-y-2 justify-center sm:justify-start list-none p-0 m-0"
        aria-label={t('chartLegendAriaLabel')}
      >
        <li className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-success" aria-hidden />
          <span>{t('income')}</span>
        </li>
        <li className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-destructive" aria-hidden />
          <span>{t('expense')}</span>
        </li>
      </ul>
    </div>
  );
}
