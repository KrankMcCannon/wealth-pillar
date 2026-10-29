/**
 * BudgetChart — andamento cumulativo delle spese nel periodo (tutti i budget; skin Stitch dark).
 */

'use client';

import { useId, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { stitchBudgets, stitchBudgetsChartSvg } from '@/styles/home-design-foundation';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';

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
}

export function BudgetChart({ spent, chartData }: Readonly<BudgetChartProps>) {
  const t = useTranslations('Budgets.Chart');
  const locale = useLocale();
  const titleId = useId().replace(/:/g, '');
  const descId = useId().replace(/:/g, '');
  const labelledBy = `${titleId} ${descId}`;

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

  const visibleDayLabels = useMemo(() => {
    if (!chartData || !hasLine) return [];

    const visible = chartData.filter((p) => !p.isFuture);
    const totalVisible = visible.length;
    if (totalVisible === 0) return [];

    const slots: { index: number; dayOfMonth: number; x: number }[] = [];

    for (let index = 0; index < totalVisible; index++) {
      const point = visible[index];
      if (!point) continue;
      const dayOfMonth = new Date(point.date).getDate();
      const showDay =
        index === 0 ||
        index === totalVisible - 1 ||
        (totalVisible > 7 && index % Math.ceil(totalVisible / 5) === 0);

      if (showDay) {
        slots.push({ index, dayOfMonth, x: point.x });
      }
    }

    return slots;
  }, [chartData, hasLine]);

  return (
    <section aria-label={t('sectionAriaLabel')}>
      <div className={stitchBudgets.detailChartCard}>
        <div className={stitchBudgets.detailChartHeader}>
          <div>
            <p className={stitchBudgets.detailChartHeaderLabel}>{t('spentLabel')}</p>
            <p className={stitchBudgets.detailChartHeaderAmount}>
              {formatCurrencyLocale(spent, locale)}
            </p>
          </div>
        </div>

        {!hasLine ? <p className={stitchBudgets.detailChartEmpty}>{t('emptyState')}</p> : null}

        <div className={stitchBudgets.detailChartSvgWrap}>
          <svg
            className={stitchBudgets.detailChartSvg}
            viewBox="0 0 350 180"
            preserveAspectRatio="xMidYMid meet"
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

            <line
              x1="0"
              y1="179.5"
              x2="350"
              y2="179.5"
              stroke={stitchBudgetsChartSvg.gridLine}
              strokeWidth="1"
              strokeOpacity={0.85}
            />

            {[25, 50, 75].map((percent) => (
              <line
                key={percent}
                x1="0"
                y1={180 - percent * 1.8}
                x2="350"
                y2={180 - percent * 1.8}
                stroke={stitchBudgetsChartSvg.gridLine}
                strokeWidth="1"
              />
            ))}

            {hasLine && lastPoint ? (
              <>
                <path
                  d={`${path} L ${lastPoint.x} 180 L 0 180 Z`}
                  className={stitchBudgetsChartSvg.areaFillClass}
                />
                <path
                  d={path}
                  fill="none"
                  stroke={stitchBudgetsChartSvg.lineStroke}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx={lastPoint.x}
                  cy={lastPoint.y}
                  r="4"
                  fill={stitchBudgetsChartSvg.dotFill}
                />
              </>
            ) : null}
          </svg>

          {visibleDayLabels.length > 0 ? (
            <div className={stitchBudgets.detailChartDayRow} aria-hidden="true">
              {visibleDayLabels.map(({ index, dayOfMonth }) => (
                <span key={`day-${index}`}>{dayOfMonth}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
