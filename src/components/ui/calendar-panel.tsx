'use client';

import { useCallback, useMemo, useState } from 'react';
import { addMonths, format, isValid, startOfYear, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { calendarDrawerStyles } from '@/lib/styles/calendar-drawer.styles';
import { MonthGrid, MonthHeader, WeekdayLabels } from './primitives/date-drawer';

export interface CalendarPanelProps {
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
  className?: string | undefined;
  compact?: boolean | undefined;
}

export function CalendarPanel({
  value,
  onChange,
  onClose,
  className,
  compact = false,
}: Readonly<CalendarPanelProps>) {
  const selectedDate = useMemo(
    () => (value && isValid(new Date(value)) ? new Date(value) : undefined),
    [value]
  );

  const [currentMonth, setCurrentMonth] = useState(() => selectedDate || startOfYear(new Date()));

  const handlePrevious = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const handleMonthYearChange = useCallback((newDate: Date) => {
    setCurrentMonth(newDate);
  }, []);

  const handleDateSelect = useCallback(
    (date: Date) => {
      onChange(format(date, 'yyyy-MM-dd'));
      onClose();
    },
    [onChange, onClose]
  );

  return (
    <div className={cn(calendarDrawerStyles.panel.container, compact && 'flex-none', className)}>
      <MonthHeader
        currentMonth={currentMonth}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onMonthChange={handleMonthYearChange}
        {...(compact ? { className: 'px-3 py-2' } : {})}
      />
      <WeekdayLabels highlightWeekends {...(compact ? { className: 'px-3' } : {})} />
      <MonthGrid
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        {...(compact ? { className: 'px-3 pb-3' } : {})}
      />
    </div>
  );
}
