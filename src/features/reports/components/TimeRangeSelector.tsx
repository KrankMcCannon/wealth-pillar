'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

export type TimeRange = 'all' | '7d' | '30d' | '3m' | '6m' | '1y';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const t = useTranslations('Reports.TimeRangeSelector');

  const options = useMemo(
    () => [
      { value: 'all' as TimeRange, label: t('allTime') },
      { value: '7d' as TimeRange, label: t('last7Days') },
      { value: '30d' as TimeRange, label: t('last30Days') },
      { value: '3m' as TimeRange, label: t('last3Months') },
      { value: '6m' as TimeRange, label: t('last6Months') },
      { value: '1y' as TimeRange, label: t('lastYear') },
    ],
    [t]
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('ariaLabel')}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3 py-1.5 min-h-9 text-xs font-semibold transition-colors duration-150 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 flex items-center justify-center ${
              isActive
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card text-primary/70 border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary/30'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
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
