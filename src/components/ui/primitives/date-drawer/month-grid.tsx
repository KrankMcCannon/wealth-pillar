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
import { useLocale, useTranslations } from 'next-intl';
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
  const locale = useLocale();
  const t = useTranslations('Forms.DateDrawer.dayCell');

  const monthDays = useMemo(() => calculateMonthDays(currentMonth), [currentMonth]);
  const today = useMemo(() => new Date(), []);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [locale]
  );

  const ariaLabels = useMemo(
    () => monthDays.map((date) => t('selectDate', { date: dateFormatter.format(date) })),
    [monthDays, dateFormatter, t]
  );

  return (
    <div className={cn(calendarDrawerStyles.grid.container, className)} role="grid">
      {monthDays.map((date, index) => (
        <DayCell
          key={`${format(date, 'yyyy-MM-dd')}-${index}`}
          date={date}
          ariaLabel={ariaLabels[index] ?? ''}
          isSelected={selectedDate ? isSameDay(date, selectedDate) : false}
          isToday={isSameDay(date, today)}
          isDisabled={false}
          isWeekend={checkIsWeekend(date)}
          isOtherMonth={!isSameMonth(date, currentMonth)}
          onClick={onDateSelect}
        />
      ))}
    </div>
  );
}

function calculateMonthDays(month: Date): Date[] {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}
