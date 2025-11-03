/**
 * BudgetChart Component
 * Line chart showing expense trends over time
 * Includes comparison with previous period
 */

'use client';

import { Card } from '@/components/ui';
import { formatCurrency, LineChartData } from '@/lib';
import { getComparisonStyles, budgetStyles } from '../theme/budget-styles';
import { PeriodComparison, PeriodInfo } from '../services/budgets-view-model';
import React from 'react';

export interface BudgetChartProps {
  spent: number;
  chartData: LineChartData;
  periodComparison: PeriodComparison | null;
  periodInfo: PeriodInfo | null;
}

export function BudgetChart({
  spent,
  chartData,
  periodComparison,
  periodInfo,
}: Readonly<BudgetChartProps>) {
  return (
    <section>
      <Card className={budgetStyles.chart.card}>
        {/* Header with amount and comparison */}
        <div className={budgetStyles.chart.header}>
          <div>
            <p className={budgetStyles.chart.headerLabel}>Hai speso</p>
            <p className={budgetStyles.chart.headerAmount}>{formatCurrency(spent)}</p>
          </div>
          {periodComparison && periodComparison.previousTotal > 0 && (
            <div
              className={
                getComparisonStyles(periodComparison.isHigher).container
              }
            >
              <p
                className={
                  getComparisonStyles(periodComparison.isHigher).text
                }
              >
                {periodComparison.isHigher ? '+' : ''}
                {formatCurrency(periodComparison.difference)}
              </p>
            </div>
          )}
        </div>

        {/* Revolut-style Line Chart */}
        <div className={budgetStyles.chart.svgContainer}>
          <svg
            className="w-full h-full"
            viewBox="0 0 350 180"
            preserveAspectRatio="none"
          >
            {/* Subtle horizontal grid lines */}
            {[25, 50, 75].map((percent) => (
              <line
                key={percent}
                x1="0"
                y1={180 - percent * 1.8}
                x2="350"
                y2={180 - percent * 1.8}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
            ))}

            {/* Line for cumulative amounts */}
            {chartData.pathD && chartData.data.length > 0 && (() => {
              const visiblePoints = chartData.data.filter((p) => !p.isFuture);
              const lastPoint = visiblePoints.at(-1);

              if (!lastPoint || typeof lastPoint.x !== 'number' || typeof lastPoint.y !== 'number') {
                return null;
              }

              return (
                <>
                  {/* Subtle gradient fill under line */}
                  <defs>
                    <linearGradient
                      id="lineGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        style={{ stopColor: '#7578EC', stopOpacity: 0.08 }}
                      />
                      <stop
                        offset="100%"
                        style={{ stopColor: '#7578EC', stopOpacity: 0 }}
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d={`${chartData.pathD} L ${lastPoint.x} 180 L 0 180 Z`}
                    fill="url(#lineGradient)"
                  />

                  {/* Main smooth line */}
                  <path
                    d={chartData.pathD}
                    fill="none"
                    stroke="#7578EC"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Dot at the end of line */}
                  <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill="#7578EC" />
                </>
              );
            })()}
          </svg>

          {/* Day numbers at bottom */}
          {periodInfo && (
            <div className={budgetStyles.chart.dayLabels}>
              <div className="flex justify-between" style={{ width: '100%' }}>
                {Array.from({ length: 30 }).map((_, index) => {
                  const startDate = new Date(periodInfo.startDate);
                  startDate.setHours(0, 0, 0, 0);
                  const currentDate = new Date(startDate);
                  currentDate.setDate(startDate.getDate() + index);
                  const dayOfMonth = currentDate.getDate();
                  const showDay = index % 5 === 0 || index === 29;
                  const position = (index / 29) * 100;

                  return (
                    <span
                      key={index}
                      className={`${budgetStyles.chart.dayLabel} absolute ${
                        showDay ? 'text-black' : 'text-transparent'
                      }`}
                      style={{
                        left: `${position}%`,
                        transform: 'translateX(-50%)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
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
