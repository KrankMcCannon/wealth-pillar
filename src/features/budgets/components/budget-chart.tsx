'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';
import { formatDateShort } from '@/lib/utils/date-utils';
import { SectionDisclosure } from '@/components/shared/section-disclosure';
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
  const ux = useTranslations('Budgets.UX');
  const locale = useLocale();
  const points = (chartData ?? []).filter((p) => !p.isFuture);
  const [selected, setSelected] = useState<number | null>(null);
  const index = Math.min(selected ?? points.length - 1, points.length - 1);
  const point = points[index];
  const min = Math.min(0, ...points.map((p) => p.amount));
  const max = Math.max(1, ...points.map((p) => p.amount));
  const day = (value: string) => Date.parse(value.slice(0, 10));
  const first = day(points[0]?.date ?? '2000-01-01');
  const span = Math.max(1, day(points.at(-1)?.date ?? '2000-01-01') - first);
  const x = (i: number) => 12 + ((day(points[i]!.date) - first) / span) * 326;
  const y = (n: number) => 160 - ((n - min) / (max - min)) * 130;
  const money = (n: number) => formatCurrencyLocale(n, locale);
  return (
    <section aria-label={t('sectionAriaLabel')} className="min-w-0 space-y-3">
      <p className="text-sm text-muted-foreground">{t('spentLabel')}</p>
      <p className="font-display text-2xl tabular-nums">{money(spent)}</p>
      {point ? (
        <>
          <div className="flex justify-between text-sm tabular-nums">
            <span>{money(min)}</span>
            <span>{money(max)}</span>
          </div>
          <svg
            viewBox="0 0 350 180"
            className="w-full max-h-44 text-primary"
            role="img"
            aria-label={`${ux('cumulative')}: ${money(spent)}`}
          >
            <line x1="12" x2="338" y1={y(0)} y2={y(0)} stroke="currentColor" opacity="0.2" />
            <polyline
              points={points.map((p, i) => `${x(i)},${y(p.amount)}`).join(' ')}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            <circle cx={x(index)} cy={y(point.amount)} r="4" fill="currentColor" />
          </svg>
          <div className="flex justify-between gap-3 text-sm">
            <span>{formatDateShort(points[0]!.date, locale)}</span>
            <span>{formatDateShort(points.at(-1)!.date, locale)}</span>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            {ux('chartDay')}
            <input
              type="range"
              min="0"
              max={points.length - 1}
              value={index}
              onChange={(e) => setSelected(Number(e.target.value))}
              className="min-h-11 w-full accent-primary"
              aria-valuetext={`${formatDateShort(point.date, locale)}: ${money(point.amount)}`}
            />
          </label>
          <p role="status" className="tabular-nums">
            {formatDateShort(point.date, locale)} · {money(point.amount)}
          </p>
          <SectionDisclosure label={ux('data')}>
            <table className="w-full text-sm">
              <caption className="sr-only">{ux('cumulative')}</caption>
              <thead>
                <tr>
                  <th scope="col" className="py-2 text-left">
                    {ux('date')}
                  </th>
                  <th scope="col" className="text-right">
                    {ux('cumulative')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.date} className="border-t border-border">
                    <th scope="row" className="py-2 text-left font-normal">
                      {formatDateShort(p.date, locale)} {p.date.slice(0, 4)}
                    </th>
                    <td className="text-right tabular-nums">{money(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionDisclosure>
        </>
      ) : (
        <p role="status">{t('emptyState')}</p>
      )}
    </section>
  );
}
