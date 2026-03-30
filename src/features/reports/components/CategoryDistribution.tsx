'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/shared';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import { rechartsPieChartInitialDimension } from '@/lib/utils/recharts-responsive';

interface CategoryDistributionProps {
  data: { id: string; name: string; value: number; color: string }[];
  total: number;
}

/** ~3 righe elenco (~114–116px con py-1.5 + space-y-1). */
const CATEGORY_LIST_MAX_H =
  'max-h-[7rem] overflow-y-auto overscroll-y-contain pr-1 ' +
  'scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent ' +
  'hover:scrollbar-thumb-primary/40 scrollbar-thumb-rounded-full';

const SCROLL_HINT_MIN_ITEMS = 4;

export function CategoryDistribution({ data, total }: CategoryDistributionProps) {
  const t = useTranslations('Reports.Charts');
  const { format: formatMoney } = useFormatCurrency();
  const sectionId = useId();
  const headingId = `${sectionId}-heading`;

  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-primary/15 rounded-xl p-4 sm:p-6 h-full flex flex-col">
        <div className="mb-4">
          <h3 id={headingId} className="text-base sm:text-lg font-semibold text-primary">
            {t('categoryDistributionTitle')}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground text-pretty line-clamp-3 mt-1">
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
    <section
      className="bg-card border border-primary/15 rounded-xl p-4 sm:p-6 h-full"
      aria-labelledby={headingId}
    >
      <div className="mb-4">
        <h3 id={headingId} className="text-base sm:text-lg font-semibold text-primary">
          {t('categoryDistributionTitle')}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground text-pretty line-clamp-3 mt-1">
          {t('categoryDistributionSubtitle')}
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:gap-6">
        <div
          className="relative h-[180px] min-h-[160px] w-full min-w-0 shrink-0 sm:h-[200px]"
          aria-hidden
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            initialDimension={rechartsPieChartInitialDimension}
          >
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
                    const item = first.payload as {
                      name: string;
                      value: number;
                      color: string;
                    };
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
                          {formatMoney(item.value)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'}%
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {(() => {
            const formatted = formatMoney(total);
            const valueFontClass =
              formatted.length <= 7
                ? 'text-sm sm:text-base'
                : formatted.length <= 10
                  ? 'text-xs sm:text-sm'
                  : 'text-[10px] sm:text-xs';
            return (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2">
                <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
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

        <div className="w-full min-h-0 flex flex-col gap-1.5">
          <div
            className={cn('w-full space-y-1', CATEGORY_LIST_MAX_H)}
            role="region"
            aria-label={t('categoryListRegionAria')}
            tabIndex={0}
          >
            {data.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-primary/5 transition-colors motion-reduce:transition-none"
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
                    {formatMoney(item.value)}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground ml-1.5">
                    {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          {data.length >= SCROLL_HINT_MIN_ITEMS ? (
            <p className="text-[10px] sm:text-xs text-muted-foreground/90 text-center sm:text-start">
              {t('categoryListScrollHint')}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
