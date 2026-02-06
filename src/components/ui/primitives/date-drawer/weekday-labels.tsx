/**
 * Weekday Labels Component
 *
 * Static header row displaying Italian weekday abbreviations
 * 7-column grid matching calendar layout
 *
 * Features:
 * - Italian locale (Lu, Ma, Me, Gi, Ve, Sa, Do)
 * - Optional weekend highlighting
 * - Responsive typography
 */

'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { calendarDrawerStyles } from '@/lib/styles/calendar-drawer.styles';
import { weekdayLabelVariants } from '@/lib/utils/date-drawer-variants';
import { cn } from '@/lib/utils';

interface WeekdayLabelsProps {
  /**
   * Apply different styling to weekend labels (Sa, Do)
   * @default false
   */
  highlightWeekends?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * WeekdayLabels - Static header row for calendar
 *
 * Displays Italian weekday abbreviations in a 7-column grid
 * Matches the calendar grid layout
 *
 * @example
 * ```tsx
 * <WeekdayLabels highlightWeekends />
 * ```
 */
export function WeekdayLabels({
  highlightWeekends = false,
  className,
}: Readonly<WeekdayLabelsProps>) {
  const locale = useLocale();
  const weekdays = useMemo(() => {
    // January 1, 2024 is a Monday; this keeps Monday-first ordering.
    const monday = new Date(Date.UTC(2024, 0, 1));
    const shortFormatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const fullFormatter = new Intl.DateTimeFormat(locale, { weekday: 'long' });

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setUTCDate(monday.getUTCDate() + index);
      return {
        short: shortFormatter.format(date),
        full: fullFormatter.format(date),
      };
    });
  }, [locale]);

  return (
    <tr className={cn(calendarDrawerStyles.weekdays.container, className)}>
      {weekdays.map((day, index) => {
        // Saturday (index 5) and Sunday (index 6) are weekends
        const isWeekend = highlightWeekends && (index === 5 || index === 6);

        return (
          <th
            key={day.full}
            className={cn(calendarDrawerStyles.weekdays.label, weekdayLabelVariants({ isWeekend }))}
            aria-label={day.full}
          >
            {day.short}
          </th>
        );
      })}
    </tr>
  );
}
