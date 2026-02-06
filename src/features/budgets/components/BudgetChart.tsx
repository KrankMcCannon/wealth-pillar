/**
 * BudgetChart Component
 * Line chart showing expense trends over time
 * Includes comparison with previous period
 */

'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui';
import {
  budgetStyles,
  getChartGradientStartStyle,
  getChartGradientEndStyle,
  getChartDayRowStyle,
  getChartDayLabelStyle,
} from '@/styles/system';
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
    <section>
      <Card className={budgetStyles.chart.card}>
        {/* Header with amount and comparison */}
        <div className={budgetStyles.chart.header}>
          <div>
            <p className={budgetStyles.chart.headerLabel}>{t('spentLabel')}</p>
            <p className={budgetStyles.chart.headerAmount}>{formatCurrency(spent)}</p>
          </div>
        </div>

        {/* Revolut-style Line Chart */}
        <div className={budgetStyles.chart.svgContainer}>
          <svg className={budgetStyles.chart.svg} viewBox="0 0 350 180" preserveAspectRatio="none">
            {/* Subtle horizontal grid lines */}
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

            {/* Line for cumulative amounts */}
            {chartData && chartData.length > 0 && lastPoint && (
              <>
                {/* Subtle gradient fill under line */}
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={getChartGradientStartStyle()} />
                    <stop offset="100%" style={getChartGradientEndStyle()} />
                  </linearGradient>
                </defs>
                <path d={`${path} L ${lastPoint.x} 180 L 0 180 Z`} fill="url(#lineGradient)" />

                {/* Main smooth line */}
                <path
                  d={path}
                  fill="none"
                  stroke={budgetStyles.chart.lineStroke}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Dot at the end of line */}
                <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill={budgetStyles.chart.dotFill} />
              </>
            )}
          </svg>

          {/* Day numbers at bottom */}
          {periodInfo && (
            <div className={budgetStyles.chart.dayLabels}>
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
                      key={`day-${dayOfMonth}`}
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
          )}
        </div>
      </Card>
    </section>
  );
}
