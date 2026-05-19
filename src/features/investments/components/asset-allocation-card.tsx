'use client';

import { useTranslations, useLocale } from 'next-intl';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { rechartsPieChartInitialDimension } from './investment-chart-theme';
import { investmentsStyles } from '@/features/investments';

interface AllocationData {
  name: string;
  value: number;
  color: string;
}

interface AssetAllocationCardProps {
  data: AllocationData[];
  className?: string;
}

export function AssetAllocationCard({ data, className }: AssetAllocationCardProps) {
  const t = useTranslations('Investments.PersonalTab');
  const locale = useLocale();

  // Fallback data if no investments
  const displayData =
    data && data.length > 0
      ? data
      : [
          { name: t('fallback.equities'), value: 65, color: '#8fb0ff' },
          { name: t('fallback.bonds'), value: 25, color: '#8fe2b4' },
          { name: t('fallback.cash'), value: 10, color: '#9fb9ff' },
        ];

  const totalValue = displayData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={cn(investmentsStyles.card.root, 'relative overflow-hidden p-6', className)}>
      {/* Header section with icon and title */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8fb0ff]/15 text-[#8fb0ff] shadow-inner">
            <PieChartIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className={investmentsStyles.card.title}>{t('assetAllocation')}</h2>
            <p
              className={
                investmentsStyles.card.description + ' text-[11px] uppercase tracking-wider'
              }
            >
              {t('portfolioHeroHint')}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center">
        {/* Left Side: Premium Chart */}
        <div className="relative flex h-[225px] w-full items-center justify-center lg:h-[300px] lg:w-[300px]">
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
                animationBegin={0}
                animationDuration={1500}
                stroke="none"
              >
                {displayData.map((entry) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={entry.color}
                    className="hover:opacity-85 transition-opacity duration-300 cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0]?.payload;
                    return (
                      <div className="rounded-xl border border-white/15 bg-[#081535]/95 p-4 shadow-2xl backdrop-blur-md">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#9fb0d7] mb-1">
                          {item.name}
                        </p>
                        <p className="text-xl font-bold text-[#e6ecff]">
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

          {/* Center Summary Statistics */}
          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9fb0d7]/80">
              {t('totalPaidLabel')}
            </span>
            <span className="mt-1 text-3xl font-bold tracking-tighter text-[#e6ecff] tabular-nums">
              {new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(totalValue)}
            </span>
          </div>
        </div>

        {/* Right Side: Interactive Legend */}
        <div className="flex flex-1 flex-col gap-3">
          {displayData.map((entry) => {
            const percentage = totalValue > 0 ? (entry.value / totalValue) * 100 : 0;
            return (
              <div
                key={entry.name}
                className="group flex items-center justify-between rounded-2xl bg-[#11295f]/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all hover:bg-[#17336f]/80 hover:translate-x-1"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="h-3 w-3 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.3)] ring-1 ring-white/10"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#e6ecff] group-hover:text-[#8fb0ff] transition-colors">
                      {entry.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-24 overflow-hidden rounded-full bg-[#1a2b5f]">
                        <div
                          className="h-full rounded-full bg-current transition-all duration-1000"
                          style={{ width: `${percentage}%`, color: entry.color }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[#9fb0d7]">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-[#e6ecff] tabular-nums">
                    {new Intl.NumberFormat(locale, {
                      style: 'currency',
                      currency: 'EUR',
                      maximumFractionDigits: 0,
                    }).format(entry.value)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Background Decor Blobs */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#3359c5]/15 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#11295f]/20 blur-[120px]" />
    </div>
  );
}
