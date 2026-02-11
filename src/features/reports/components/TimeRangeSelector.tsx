'use client';

import { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { reportsStyles } from '@/features/reports/theme/reports-styles';

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
    <div className={reportsStyles.timeRange.container}>
      <Calendar className={reportsStyles.timeRange.triggerIcon + ' text-primary/60'} />
      <div className={reportsStyles.timeRange.chipGroup}>
        {options.map((opt) => (
          <button
            key={opt.value}
            className={
              value === opt.value
                ? reportsStyles.timeRange.chipActive
                : reportsStyles.timeRange.chip
            }
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Get a Date representing the start of the selected time range.
 * Returns null for "all time" (no filtering).
 */
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
