/**
 * Month Header Component
 *
 * Navigation header for calendar with month/year display
 * Previous/Next buttons with optional constraints
 *
 * Features:
 * - Italian locale month names
 * - Previous/Next navigation
 * - Optional min/max month constraints
 * - Swipe gesture support (drag detection)
 */

"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { calendarDrawerStyles } from "@/src/lib/styles/calendar-drawer.styles";
import { monthNavButtonVariants } from "@/src/lib/utils/date-drawer-variants";
import { cn } from "@/src/lib/utils/ui-variants";

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
   * Additional CSS classes
   */
  className?: string;
}

/**
 * MonthHeader - Calendar navigation header
 *
 * Displays current month/year with previous/next navigation
 * Always allows free navigation without restrictions
 *
 * @example
 * ```tsx
 * <MonthHeader
 *   currentMonth={currentMonth}
 *   onPrevious={() => setCurrentMonth(subMonths(currentMonth, 1))}
 *   onNext={() => setCurrentMonth(addMonths(currentMonth, 1))}
 * />
 * ```
 */
export function MonthHeader({
  currentMonth,
  onPrevious,
  onNext,
  className,
}: MonthHeaderProps) {
  // Format month and year for display
  const monthYearText = format(currentMonth, "MMMM yyyy", { locale: it });

  // Capitalize first letter (Italian months start lowercase)
  const capitalizedText = monthYearText.charAt(0).toUpperCase() + monthYearText.slice(1);

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

      {/* Month and Year Display */}
      <h2 className={calendarDrawerStyles.header.monthYear} aria-live="polite">
        {capitalizedText}
      </h2>

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
