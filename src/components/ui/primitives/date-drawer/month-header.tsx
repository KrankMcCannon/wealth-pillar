/**
 * Month Header Component
 *
 * Navigation header for calendar with month/year display
 */

'use client';

import { useState, useMemo } from 'react';
import { setMonth, setYear, getYear, getMonth } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
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
  const [showDropdowns, setShowDropdowns] = useState(false);

  const currentMonthNum = getMonth(currentMonth);
  const currentYearNum = getYear(currentMonth);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let i = 2000; i <= 2100; i++) {
      years.push(i);
    }
    return years;
  }, []);

  const monthNames = useMemo(
    () => [
      ...Array.from({ length: 12 }, (_, index) =>
        new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2024, index, 1))
      ),
    ],
    [locale]
  );

  const monthYearText = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(currentMonth);
  const capitalizedText = monthYearText.charAt(0).toUpperCase() + monthYearText.slice(1);

  const handleMonthSelect = (monthIndex: string) => {
    const newDate = setMonth(currentMonth, Number.parseInt(monthIndex, 10));
    onMonthChange?.(newDate);
  };

  const handleYearSelect = (year: string) => {
    const newDate = setYear(currentMonth, Number.parseInt(year, 10));
    onMonthChange?.(newDate);
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

      <div className={calendarDrawerStyles.header.center}>
        {showDropdowns ? (
          <div className={calendarDrawerStyles.header.dropdowns}>
            <Select value={currentMonthNum.toString()} onValueChange={handleMonthSelect}>
              <SelectTrigger
                className={cn(
                  calendarDrawerStyles.header.selectTrigger,
                  calendarDrawerStyles.header.selectTriggerMonth
                )}
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

            <button
              type="button"
              onClick={() => setShowDropdowns(false)}
              className={calendarDrawerStyles.header.closeButton}
              aria-label={t('monthHeader.closeSelectors')}
            >
              {t('monthHeader.close')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDropdowns(true)}
            className={cn(
              calendarDrawerStyles.header.monthYear,
              calendarDrawerStyles.header.monthYearButton
            )}
            aria-label={t('monthHeader.selectMonthAndYear')}
          >
            <span>{capitalizedText}</span>
            <ChevronDown className={calendarDrawerStyles.header.chevronIcon} />
          </button>
        )}
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
