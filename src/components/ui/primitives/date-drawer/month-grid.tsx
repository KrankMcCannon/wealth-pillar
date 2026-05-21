/**
 * Month Grid Component
 *
 * Renders a calendar month grid with date calculations
 * 7-column grid (Monday-Sunday, European convention)
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
  currentMonth: Date;
  selectedDate?: Date | undefined;
  onDateSelect: (date: Date) => void;
  className?: string | undefined;
}

export function MonthGrid({
  currentMonth,
  selectedDate,
  onDateSelect,
  className,
}: Readonly<MonthGridProps>) {
  const monthDays = useMemo(() => {
    return calculateMonthDays(currentMonth);
  }, [currentMonth]);

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
          />
        );
      })}
    </div>
  );
}

function calculateMonthDays(month: Date): Date[] {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });
}
