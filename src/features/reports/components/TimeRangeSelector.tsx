'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarRange, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimeRange = 'all' | '7d' | '30d' | '3m' | '6m' | '1y';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const RANGE_ORDER: TimeRange[] = ['all', '7d', '30d', '3m', '6m', '1y'];

const RANGE_LABEL_KEYS = {
  all: 'allTime',
  '7d': 'last7Days',
  '30d': 'last30Days',
  '3m': 'last3Months',
  '6m': 'last6Months',
  '1y': 'lastYear',
} as const satisfies Record<TimeRange, string>;

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const t = useTranslations('Reports.TimeRangeSelector');

  const options = useMemo(
    () =>
      RANGE_ORDER.map((r) => ({
        value: r,
        label: t(RANGE_LABEL_KEYS[r]),
      })),
    [t]
  );

  const hintId = 'reports-time-filter-hint';

  return (
    <div className="flex flex-col gap-1.5 sm:gap-1">
      <div className="flex items-center gap-2 min-w-0">
        <CalendarRange className="size-4 shrink-0 text-primary/65" aria-hidden />
        <div className="relative flex-1 min-w-0 sm:max-w-[min(100%,18rem)]">
          <select
            id="reports-time-range-select"
            className={cn(
              'w-full min-h-10 cursor-pointer appearance-none rounded-xl border border-primary/20',
              'bg-card py-2 ps-3 pe-9 text-sm font-medium text-primary shadow-sm',
              'transition-colors duration-150 hover:border-primary/30 hover:bg-primary/3',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              'motion-reduce:transition-none'
            )}
            value={value}
            aria-label={t('ariaLabel')}
            aria-describedby={hintId}
            onChange={(e) => onChange(e.target.value as TimeRange)}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute inset-e-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        </div>
      </div>
      <p
        id={hintId}
        className="text-[10px] sm:text-xs text-muted-foreground leading-snug sm:ps-6 max-w-prose"
      >
        {t('filterAppliesHint')}
      </p>
    </div>
  );
}

export function getTimeRangeStartDate(range: TimeRange): Date | null {
  if (range === 'all') return null;

  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    case '30d':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    case '3m':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case '6m':
      return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case '1y':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default:
      return null;
  }
}
