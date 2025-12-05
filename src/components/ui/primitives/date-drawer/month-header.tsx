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
import { calendarDrawerStyles } from "@/src/lib/styles/calendar-drawer.styles";
import { monthNavButtonVariants } from "@/src/lib/utils/date-drawer-variants";
import { cn } from "@/src/lib/utils/ui-variants";
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
}: MonthHeaderProps) {
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
    const newDate = setMonth(currentMonth, parseInt(monthIndex));
    onMonthChange?.(newDate);
    // Don't close dropdowns - let user select year too
  };

  // Handle year selection
  const handleYearSelect = (year: string) => {
    const newDate = setYear(currentMonth, parseInt(year));
    onMonthChange?.(newDate);
    // Don't close dropdowns - let user select month too
  };

  return (
    <div className={cn(calendarDrawerStyles.header.container, className)} role="banner">
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
      <div className="flex-1 flex flex-col items-center gap-2">
        {!showDropdowns ? (
          // Display mode - clickable to show dropdowns
          <button
            type="button"
            onClick={() => setShowDropdowns(true)}
            className={cn(
              calendarDrawerStyles.header.monthYear,
              "hover:bg-primary/5 px-3 py-1 rounded-lg transition-colors",
              "flex items-center gap-1.5"
            )}
            aria-label="Seleziona mese e anno"
          >
            <span>{capitalizedText}</span>
            <ChevronDown className="h-4 w-4 text-primary/70" />
          </button>
        ) : (
          // Dropdown mode
          <div className="flex items-center gap-2 w-full max-w-[280px]">
            {/* Month Dropdown */}
            <Select
              value={currentMonthNum.toString()}
              onValueChange={handleMonthSelect}
            >
              <SelectTrigger className="flex-1 h-9 text-sm font-semibold border-primary/20 focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[240px]">
                {monthNames.map((month, index) => (
                  <SelectItem
                    key={index}
                    value={index.toString()}
                    className="text-sm font-medium"
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
              <SelectTrigger className="w-[90px] h-9 text-sm font-semibold border-primary/20 focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[240px]">
                {yearOptions.map((year) => (
                  <SelectItem
                    key={year}
                    value={year.toString()}
                    className="text-sm font-medium tabular-nums"
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Close dropdowns button */}
            <button
              type="button"
              onClick={() => setShowDropdowns(false)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors px-2"
              aria-label="Chiudi selettori"
            >
              Chiudi
            </button>
          </div>
        )}
      </div>

      {/* Next Month Button */}
      <button
        type="button"
        onClick={onNext}
        className={monthNavButtonVariants({ disabled: false })}
        aria-label="Mese successivo"
      >
        <ChevronRight className={calendarDrawerStyles.header.navButton.icon} />
      </button>
    </div>
  );
}
