/**
 * Month Header Component
 *
 * Navigation header for calendar with month/year display
 * Previous/Next buttons with inline dropdown selection
 *
 * Features:
 * - Italian locale month names
 * - Previous/Next navigation
 * - Click month/year to show inline dropdown selectors
 * - Direct month and year selection
 */

"use client";

import { useState, useMemo } from "react";
import { format, setMonth, setYear, getYear, getMonth } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { calendarDrawerStyles } from "@/lib/styles/calendar-drawer.styles";
import { monthNavButtonVariants } from "@/lib/utils/date-drawer-variants";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface MonthHeaderProps {
  /**
   * Current month being displayed
   */
  currentMonth: Date;

  /**
   * Callback to navigate to previous month
   */
  onPrevious: () => void;

  /**
   * Callback to navigate to next month
   */
  onNext: () => void;

  /**
   * Callback when month/year is directly selected (NEW)
   */
  onMonthChange?: (date: Date) => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * MonthHeader - Calendar navigation header with inline dropdowns
 *
 * Click the month/year text to show dropdown selectors for quick navigation
 *
 * @example
 * ```tsx
 * <MonthHeader
 *   currentMonth={currentMonth}
 *   onPrevious={() => setCurrentMonth(subMonths(currentMonth, 1))}
 *   onNext={() => setCurrentMonth(addMonths(currentMonth, 1))}
 *   onMonthChange={(newDate) => setCurrentMonth(newDate)}
 * />
 * ```
 */
export function MonthHeader({
  currentMonth,
  onPrevious,
  onNext,
  onMonthChange,
  className,
}: Readonly<MonthHeaderProps>) {
  const [showDropdowns, setShowDropdowns] = useState(false);

  // Get current month and year
  const currentMonthNum = getMonth(currentMonth); // 0-11
  const currentYearNum = getYear(currentMonth);

  // Generate year options (2000-2100)
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let i = 2000; i <= 2100; i++) {
      years.push(i);
    }
    return years;
  }, []);

  // Italian month names
  const monthNames = useMemo(() => [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ], []);

  // Format month and year for display
  const monthYearText = format(currentMonth, "MMMM yyyy", { locale: it });
  // Capitalize first letter (Italian months start lowercase)
  const capitalizedText = monthYearText.charAt(0).toUpperCase() + monthYearText.slice(1);

  // Handle month selection
  const handleMonthSelect = (monthIndex: string) => {
    const newDate = setMonth(currentMonth, Number.parseInt(monthIndex));
    onMonthChange?.(newDate);
    // Don't close dropdowns - let user select year too
  };

  // Handle year selection
  const handleYearSelect = (year: string) => {
    const newDate = setYear(currentMonth, Number.parseInt(year));
    onMonthChange?.(newDate);
    // Don't close dropdowns - let user select year too
  };

  return (
    <header className={cn(calendarDrawerStyles.header.container, className)}>
      {/* Previous Month Button */}
      <button
        type="button"
        onClick={onPrevious}
        className={monthNavButtonVariants({ disabled: false })}
        aria-label="Mese precedente"
      >
        <ChevronLeft className={calendarDrawerStyles.header.navButton.icon} />
      </button>

      {/* Month and Year Display/Selector */}
      <div className={calendarDrawerStyles.header.center}>
        {showDropdowns ? (
          // Dropdown mode
          <div className={calendarDrawerStyles.header.dropdowns}>
            {/* Month Dropdown */}
            <Select
              value={currentMonthNum.toString()}
              onValueChange={handleMonthSelect}
            >
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

            {/* Year Dropdown */}
            <Select
              value={currentYearNum.toString()}
              onValueChange={handleYearSelect}
            >
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

            {/* Close dropdowns button */}
            <button
              onClick={() => setShowDropdowns(false)}
              className={calendarDrawerStyles.header.closeButton}
              aria-label="Chiudi selettori"
            >
              Chiudi
            </button>
          </div>
        ) : (
          // Display mode - clickable to show dropdowns
          <button
            onClick={() => setShowDropdowns(true)}
            className={cn(
              calendarDrawerStyles.header.monthYear,
              calendarDrawerStyles.header.monthYearButton
            )}
            aria-label="Seleziona mese e anno"
          >
            <span>{capitalizedText}</span>
            <ChevronDown className={calendarDrawerStyles.header.chevronIcon} />
          </button>
        )}
      </div>

      {/* Next Month Button */}
      <button
        onClick={onNext}
        className={monthNavButtonVariants({ disabled: false })}
        aria-label="Mese successivo"
      >
        <ChevronRight className={calendarDrawerStyles.header.navButton.icon} />
      </button>
    </header>
  );
}
