/**
 * BudgetChart Component
 * Line chart showing expense trends over time
 * Includes comparison with previous period
 */

'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui';
import { budgetStyles, getChartDayRowStyle, getChartDayLabelStyle } from '@/styles/system';
import { formatCurrency } from '@/lib/utils/currency-formatter';

export interface ChartDataPoint {
  x: number;
  y: number;
  amount: number;
  date: string;
  isFuture: boolean;
}

export interface BudgetChartProps {
  spent: number;
  chartData: ChartDataPoint[] | null;
  periodInfo: {
    startDate: string;
    endDate: string | null;
  } | null;
}

export function BudgetChart({ spent, chartData, periodInfo }: Readonly<BudgetChartProps>) {
  const t = useTranslations('Budgets.Chart');
  const titleId = useId().replace(/:/g, '');
  const descId = useId().replace(/:/g, '');
  const labelledBy = `${titleId} ${descId}`;
  // Generate path for chart line
  const generatePath = (points: ChartDataPoint[]): string => {
    if (points.length === 0) return '';

    const visiblePoints = points.filter((p) => !p.isFuture);
    if (visiblePoints.length === 0) return '';

    return visiblePoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  };

  const visiblePoints = chartData?.filter((p) => !p.isFuture) || [];
  const lastPoint = visiblePoints.at(-1);
  const path = chartData ? generatePath(chartData) : '';
  const hasLine = Boolean(chartData && chartData.length > 0 && lastPoint);

  // Calculate period days for date labels
  const getPeriodDays = () => {
    if (!periodInfo?.startDate) return 30;

    const start = new Date(periodInfo.startDate);
    const end = periodInfo.endDate ? new Date(periodInfo.endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 1);
  };

  const periodDays = getPeriodDays();

  return (
    <section aria-label={t('sectionAriaLabel')}>
      <Card className={budgetStyles.chart.card}>
        <div className={budgetStyles.chart.header}>
          <div>
            <p className={budgetStyles.chart.headerLabel}>{t('spentLabel')}</p>
            <p className={budgetStyles.chart.headerAmount}>{formatCurrency(spent)}</p>
          </div>
        </div>

        {!hasLine ? <p className={budgetStyles.chart.emptyHint}>{t('emptyState')}</p> : null}

        <div className={budgetStyles.chart.svgContainer}>
          <svg
            className={budgetStyles.chart.svg}
            viewBox="0 0 350 180"
            preserveAspectRatio="none"
            role={hasLine ? 'img' : undefined}
            aria-hidden={hasLine ? undefined : true}
            aria-labelledby={hasLine ? labelledBy : undefined}
          >
            {hasLine ? (
              <>
                <title id={titleId}>{t('svgTitle')}</title>
                <desc id={descId}>{t('svgDescription')}</desc>
              </>
            ) : null}
            {[25, 50, 75].map((percent) => (
              <line
                key={percent}
                x1="0"
                y1={180 - percent * 1.8}
                x2="350"
                y2={180 - percent * 1.8}
                stroke={budgetStyles.chart.gridLineColor}
                strokeWidth="1"
              />
            ))}

            {hasLine && lastPoint ? (
              <>
                <path
                  d={`${path} L ${lastPoint.x} 180 L 0 180 Z`}
                  className="fill-primary/10 dark:fill-primary/15"
                />
                <path
                  d={path}
                  fill="none"
                  stroke={budgetStyles.chart.lineStroke}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill={budgetStyles.chart.dotFill} />
              </>
            ) : null}
          </svg>

          {periodInfo && hasLine ? (
            <div className={budgetStyles.chart.dayLabels} aria-hidden="true">
              <div className={budgetStyles.chart.dayRow} style={getChartDayRowStyle()}>
                {Array.from({ length: Math.min(periodDays, 30) }).map((_, index) => {
                  const startDate = new Date(periodInfo.startDate);
                  startDate.setHours(0, 0, 0, 0);
                  const currentDate = new Date(startDate);
                  currentDate.setDate(startDate.getDate() + index);
                  const dayOfMonth = currentDate.getDate();
                  const totalDays = Math.min(periodDays, 30);
                  const showDay =
                    index === 0 ||
                    index === totalDays - 1 ||
                    (totalDays > 7 && index % Math.ceil(totalDays / 5) === 0);
                  const position = totalDays > 1 ? (index / (totalDays - 1)) * 100 : 50;

                  return (
                    <span
                      key={`day-${index}-${currentDate.toISOString().slice(0, 10)}`}
                      className={`${budgetStyles.chart.dayLabel} ${budgetStyles.chart.dayLabelPosition} ${
                        showDay
                          ? budgetStyles.chart.dayLabelVisible
                          : budgetStyles.chart.dayLabelHidden
                      }`}
                      style={getChartDayLabelStyle(position)}
                    >
                      {dayOfMonth}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
