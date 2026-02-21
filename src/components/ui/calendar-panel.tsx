'use client';

import { useCallback, useMemo, useState } from 'react';
import { addMonths, format, isValid, startOfYear, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { calendarDrawerStyles } from '@/lib/styles/calendar-drawer.styles';
import { MonthGrid, MonthHeader, QuickPresets, WeekdayLabels } from './primitives/date-drawer';

export interface CalendarPanelProps {
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
  size?: 'mobile' | 'desktop';
  className?: string;
}

/**
 * Shared calendar panel used by both mobile drawer and desktop popover wrappers.
 */
export function CalendarPanel({
  value,
  onChange,
  onClose,
  size = 'mobile',
  className,
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

  const handlePresetSelect = useCallback(
    (date: Date) => {
      setCurrentMonth(date);
      handleDateSelect(date);
    },
    [handleDateSelect]
  );

  return (
    <div className={cn(calendarDrawerStyles.panel.container, className)}>
      <MonthHeader
        currentMonth={currentMonth}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onMonthChange={handleMonthYearChange}
        size={size}
      />
      <WeekdayLabels
        highlightWeekends
        className={size === 'desktop' ? calendarDrawerStyles.desktop.weekdays.container : undefined}
      />
      <MonthGrid
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        size={size}
        className={size === 'desktop' ? calendarDrawerStyles.desktop.grid.container : undefined}
      />
      <QuickPresets selectedDate={selectedDate} onSelect={handlePresetSelect} size={size} />
    </div>
  );
}
