'use client';

import { useTranslations, useLocale } from 'next-intl';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { rechartsPieChartInitialDimension, rechartsAnimationOff } from './investment-chart-theme';
import { investmentsStyles } from '@/features/investments';
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
    <div className={cn(investmentsStyles.card.root, 'relative overflow-hidden p-4', className)}>
      <div className="relative z-10 mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <PieChartIcon className="size-5" />
        </div>
        <div>
          <h2 className={investmentsStyles.card.title}>{t('assetAllocation')}</h2>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {t('portfolioHeroHint')}
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-6">
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
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            {item.name}
                          </p>
                          <p className="text-xl font-bold text-foreground">
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
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
              {t('totalPaidLabel')}
            </span>
            <span className="mt-1 text-3xl font-bold tabular-nums tracking-tighter text-foreground">
              {new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(totalValue)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {displayData.map((entry) => {
            const percentage = totalValue > 0 ? (entry.value / totalValue) * 100 : 0;
            return (
              <div
                key={entry.name}
                className="flex items-center justify-between rounded-2xl bg-muted/50 p-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="size-3 rounded-full ring-1 ring-border/30"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">{entry.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${percentage}%`, backgroundColor: entry.color }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-base font-bold tabular-nums text-foreground">
                  {new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency: 'EUR',
                    maximumFractionDigits: 0,
                  }).format(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
