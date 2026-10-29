'use client';

import { useTranslations, useLocale } from 'next-intl';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { stitchHome, stitchInvestments } from '@/styles/home-design-foundation';
import { rechartsPieChartInitialDimension, rechartsAnimationOff } from './investment-chart-theme';
import { InvestmentChartContainer } from './investment-chart-container';
import type { AllocationChartSlice } from '@/features/investments/utils/allocation-chart-data';

interface AssetAllocationCardProps {
  data: AllocationChartSlice[];
  className?: string;
}

export function AssetAllocationCard({ data, className }: AssetAllocationCardProps) {
  const t = useTranslations('Investments.PersonalTab');
  const locale = useLocale();

  if (!data || data.length === 0) {
    return null;
  }

  const displayData = data;
  const totalValue = displayData.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className={cn(stitchInvestments.chartCard, className)}>
      <div className={stitchInvestments.chartCardHeader}>
        <h2 className={stitchInvestments.chartCardTitle}>{t('assetAllocation')}</h2>
        <p className={stitchInvestments.chartCardDescription}>{t('portfolioHeroHint')}</p>
      </div>
      <div className={stitchInvestments.chartCardContent}>
        <div className="relative h-[225px] w-full">
          <InvestmentChartContainer className="flex size-full items-center justify-center">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={rechartsPieChartInitialDimension}
            >
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={85}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  {...rechartsAnimationOff}
                >
                  {displayData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0]?.payload as AllocationChartSlice;
                      return (
                        <div className="rounded-xl border border-border/20 bg-popover p-4 shadow-md">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {item.name}
                          </p>
                          <p className="text-xl font-semibold tabular-nums text-foreground">
                            {new Intl.NumberFormat(locale, {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(item.value)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </InvestmentChartContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={stitchInvestments.chartCardTitle}>{t('totalPaidLabel')}</span>
            <span className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
              {new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(totalValue)}
            </span>
          </div>
        </div>

        <ul className={`${stitchHome.plainList} mt-4`}>
          {displayData.map((entry) => {
            const pct = totalValue > 0 ? (entry.value / totalValue) * 100 : 0;
            return (
              <li key={entry.name} className={stitchHome.plainRow}>
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className="size-3 shrink-0 rounded-full ring-1 ring-border/30"
                    style={{ backgroundColor: entry.color }}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className={stitchHome.plainRowTitle}>{entry.name}</span>
                    <span className={stitchHome.plainRowMeta}>{pct.toFixed(1)}%</span>
                  </span>
                </span>
                <span className="shrink-0 text-base font-semibold tabular-nums text-foreground">
                  {new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  }).format(entry.value)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
