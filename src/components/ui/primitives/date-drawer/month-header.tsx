'use client';

import { useMemo } from 'react';
import { setMonth, setYear, getYear, getMonth } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarDrawerStyles } from '@/lib/styles/calendar-drawer.styles';
import { monthNavButtonVariants } from '@/lib/utils/date-drawer-variants';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface MonthHeaderProps {
  currentMonth: Date;
  onPrevious: () => void;
  onNext: () => void;
  onMonthChange?: (date: Date) => void;
  className?: string;
}

export function MonthHeader({
  currentMonth,
  onPrevious,
  onNext,
  onMonthChange,
  className,
}: Readonly<MonthHeaderProps>) {
  const t = useTranslations('Forms.DateDrawer');
  const locale = useLocale();

  const currentMonthNum = getMonth(currentMonth);
  const currentYearNum = getYear(currentMonth);

  const yearOptions = useMemo(() => {
    const thisYear = getYear(new Date());
    const years: number[] = [];
    for (let year = thisYear - 60; year <= thisYear + 10; year++) {
      years.push(year);
    }
    return years;
  }, []);

  const monthNames = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) =>
        new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, index, 1))
      ),
    [locale]
  );

  const handleMonthSelect = (monthIndex: string) => {
    onMonthChange?.(setMonth(currentMonth, Number.parseInt(monthIndex, 10)));
  };

  const handleYearSelect = (year: string) => {
    onMonthChange?.(setYear(currentMonth, Number.parseInt(year, 10)));
  };

  return (
    <header className={cn(calendarDrawerStyles.header.container, className)}>
      <button
        type="button"
        onClick={onPrevious}
        className={monthNavButtonVariants({ disabled: false })}
        aria-label={t('monthHeader.previousMonth')}
      >
        <ChevronLeft className={calendarDrawerStyles.header.navButton.icon} />
      </button>

      <div className={calendarDrawerStyles.header.pickerRow}>
        <Select value={currentMonthNum.toString()} onValueChange={handleMonthSelect}>
          <SelectTrigger
            className={cn(
              calendarDrawerStyles.header.selectTrigger,
              calendarDrawerStyles.header.selectTriggerMonth
            )}
            aria-label={t('monthHeader.selectMonth')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={calendarDrawerStyles.header.selectContent}>
            {monthNames.map((month, index) => (
              <SelectItem
                key={month}
                value={index.toString()}
                className={calendarDrawerStyles.header.selectItem}
              >
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentYearNum.toString()} onValueChange={handleYearSelect}>
          <SelectTrigger
            className={cn(
              calendarDrawerStyles.header.selectTrigger,
              calendarDrawerStyles.header.selectTriggerYear
            )}
            aria-label={t('monthHeader.selectYear')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={calendarDrawerStyles.header.selectContent}>
            {yearOptions.map((year) => (
              <SelectItem
                key={year}
                value={year.toString()}
                className={calendarDrawerStyles.header.selectItemYear}
              >
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <button
        type="button"
        onClick={onNext}
        className={monthNavButtonVariants({ disabled: false })}
        aria-label={t('monthHeader.nextMonth')}
      >
        <ChevronRight className={calendarDrawerStyles.header.navButton.icon} />
      </button>
    </header>
  );
}
