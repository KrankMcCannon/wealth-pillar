/**
 * Month Grid Component
 *
 * Renders a calendar month grid with date calculations
 * 7-column grid (Monday-Sunday, European convention)
 *
 * Features:
 * - Automatic padding dates from previous/next months
 * - Weekend detection
 * - Performance optimized with useMemo
 * - All dates are selectable without restrictions
 */

'use client';

import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isWeekend as checkIsWeekend,
  format,
} from 'date-fns';
import { calendarDrawerStyles } from '@/lib/styles/calendar-drawer.styles';
import { cn } from '@/lib/utils';
import { DayCell } from './day-cell';

export interface MonthGridProps {
  /**
   * The month to display (any date within the month)
   */
  currentMonth: Date;

  /**
   * Currently selected date (if any)
   */
  selectedDate?: Date;

  /**
   * Callback when a date is selected
   */
  onDateSelect: (date: Date) => void;

  /**
   * Size variant for day cells
   * @default "mobile"
   */
  size?: 'mobile' | 'desktop';

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * MonthGrid - Calendar month view with day cells
 *
 * Renders a complete month grid including padding dates from adjacent months
 * All days are selectable without restrictions
 *
 * @example
 * ```tsx
 * <MonthGrid
 *   currentMonth={new Date(2024, 0, 15)}
 *   selectedDate={selectedDate}
 *   onDateSelect={handleDateSelect}
 * />
 * ```
 */
export function MonthGrid({
  currentMonth,
  selectedDate,
  onDateSelect,
  size = 'mobile',
  className,
}: Readonly<MonthGridProps>) {
  // Calculate all dates to display (with padding)
  const monthDays = useMemo(() => {
    return calculateMonthDays(currentMonth);
  }, [currentMonth]);

  // Today's date for comparison
  const today = useMemo(() => new Date(), []);

  return (
    <div className={cn(calendarDrawerStyles.grid.container, className)} role="grid">
      {monthDays.map((date, index) => {
        const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
        const isToday = isSameDay(date, today);
        const isWeekend = checkIsWeekend(date);
        const isOtherMonth = !isSameMonth(date, currentMonth);

        return (
          <DayCell
            key={`${format(date, 'yyyy-MM-dd')}-${index}`}
            date={date}
            isSelected={isSelected}
            isToday={isToday}
            isDisabled={false}
            isWeekend={isWeekend}
            isOtherMonth={isOtherMonth}
            onClick={onDateSelect}
            size={size}
          />
        );
      })}
    </div>
  );
}

/**
 * Calculate all dates to display for a month
 * Includes padding dates from previous/next months to fill grid
 *
 * @param month - Any date within the target month
 * @returns Array of dates to display (42 days = 6 weeks)
 */
function calculateMonthDays(month: Date): Date[] {
  // Get the first and last day of the month
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  // Get the start of the week containing the first day of the month
  // Use Monday as the start of the week (European convention)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });

  // Get the end of the week containing the last day of the month
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Generate all dates in the range
  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  return days;
}
