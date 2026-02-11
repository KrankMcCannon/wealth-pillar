'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { reportsStyles } from '@/features/reports/theme/reports-styles';
import { useTranslations } from 'next-intl';

interface CategoryDistributionProps {
  data: { id: string; name: string; value: number; color: string }[];
  total: number;
}

export function CategoryDistribution({ data, total }: CategoryDistributionProps) {
  const t = useTranslations('Reports.Charts');

  if (!data || data.length === 0) return null;

  return (
    <div className={reportsStyles.charts.container}>
      <div className={reportsStyles.charts.header}>
        <div>
          <h3 className={reportsStyles.charts.title}>{t('categoryDistributionTitle')}</h3>
          <p className={reportsStyles.charts.subtitle}>{t('categoryDistributionSubtitle')}</p>
        </div>
      </div>

      <div className={reportsStyles.categories.flexLayout}>
        {/* Chart */}
        <div className={reportsStyles.categories.chartContainer}>
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
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className={reportsStyles.charts.tooltip}>
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: data.color }}
                          />
                          <span className="font-semibold text-sm">{data.name}</span>
                        </div>
                        <div className="font-bold text-base">{formatCurrency(data.value)}</div>
                        <div className="text-xs text-primary/60">
                          {((data.value / total) * 100).toFixed(1)}%
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Total */}
          <div className={reportsStyles.categories.centerLabel}>
            <span className={reportsStyles.categories.centerLabelTitle}>{t('total')}</span>
            <span className={reportsStyles.categories.centerLabelValue}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Legend / List */}
        <div className={reportsStyles.categories.legendContainer}>
          {data.map((item) => (
            <div key={item.id} className={reportsStyles.categories.item}>
              <div className={reportsStyles.categories.itemLeft}>
                <div
                  className={reportsStyles.categories.iconBox}
                  style={{ backgroundColor: `${item.color}20`, color: item.color }}
                >
                  <div className="h-3 w-3 rounded-full bg-current" />
                </div>
                <div className={reportsStyles.categories.details}>
                  <span className={reportsStyles.categories.name}>{item.name}</span>
                  <div className={reportsStyles.categories.barBg}>
                    <div
                      className={reportsStyles.categories.barFill}
                      style={{
                        width: `${(item.value / total) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className={reportsStyles.categories.amount}>{formatCurrency(item.value)}</div>
                <div className={reportsStyles.categories.percent}>
                  {((item.value / total) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
