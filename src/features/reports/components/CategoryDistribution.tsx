'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/shared';

interface CategoryDistributionProps {
  data: { id: string; name: string; value: number; color: string }[];
  total: number;
}

export function CategoryDistribution({ data, total }: CategoryDistributionProps) {
  const t = useTranslations('Reports.Charts');

  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-primary/15 rounded-xl p-4 sm:p-6 h-full flex flex-col">
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-primary">
            {t('categoryDistributionTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground text-pretty line-clamp-3">
            {t('categoryDistributionSubtitle')}
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState title={t('noData')} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-primary/15 rounded-xl p-4 sm:p-6 h-full">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-primary">
          {t('categoryDistributionTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground text-pretty line-clamp-3">
          {t('categoryDistributionSubtitle')}
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Donut chart */}
        <div className="h-[180px] sm:h-[200px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="75%"
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const first = payload[0];
                    if (!first) return null;
                    const item = first.payload;
                    return (
                      <div
                        role="tooltip"
                        className="bg-card border border-primary/20 rounded-xl p-3 text-sm shadow-lg"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-semibold text-primary">{item.name}</span>
                        </div>
                        <div className="font-bold text-base text-primary">
                          {formatCurrency(item.value)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {((item.value / total) * 100).toFixed(1)}%
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Totale centrato — font dinamico in base alla lunghezza del valore */}
          {(() => {
            const formatted = formatCurrency(total);
            const valueFontClass =
              formatted.length <= 7
                ? 'text-sm sm:text-base'
                : formatted.length <= 10
                  ? 'text-xs sm:text-sm'
                  : 'text-[10px] sm:text-xs';
            return (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2">
                <span className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wide">
                  {t('total')}
                </span>
                <span
                  className={`${valueFontClass} font-bold text-primary tabular-nums text-center leading-tight`}
                >
                  {formatted}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Lista categorie */}
        <div className="w-full space-y-1">
          {data.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs sm:text-sm font-medium text-primary truncate">
                  {item.name}
                </span>
              </div>
              <div className="text-right shrink-0 ml-3">
                <span className="text-xs sm:text-sm font-bold text-primary tabular-nums">
                  {formatCurrency(item.value)}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground ml-1.5">
                  {((item.value / total) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
