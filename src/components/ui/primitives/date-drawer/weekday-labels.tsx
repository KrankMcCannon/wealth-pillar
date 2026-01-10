/**
 * Weekday Labels Component
 *
 * Static header row displaying Italian weekday abbreviations
 * 7-column grid matching calendar layout
 *
 * Features:
 * - Italian locale (Lu, Ma, Me, Gi, Ve, Sa, Do)
 * - Optional weekend highlighting
 * - Responsive typography
 */

import { calendarDrawerStyles } from "@/lib/styles/calendar-drawer.styles";
import { weekdayLabelVariants } from "@/lib/utils/date-drawer-variants";
import { cn } from "@/lib/utils";

/**
 * Italian weekday abbreviations
 * Starts with Monday (Italian/European convention)
 */
const ITALIAN_WEEKDAYS = ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"] as const;

interface WeekdayLabelsProps {
  /**
   * Apply different styling to weekend labels (Sa, Do)
   * @default false
   */
  highlightWeekends?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * WeekdayLabels - Static header row for calendar
 *
 * Displays Italian weekday abbreviations in a 7-column grid
 * Matches the calendar grid layout
 *
 * @example
 * ```tsx
 * <WeekdayLabels highlightWeekends />
 * ```
 */
export function WeekdayLabels({
  highlightWeekends = false,
  className,
}: WeekdayLabelsProps) {
  return (
    <div className={cn(calendarDrawerStyles.weekdays.container, className)} role="row">
      {ITALIAN_WEEKDAYS.map((day, index) => {
        // Saturday (index 5) and Sunday (index 6) are weekends
        const isWeekend = highlightWeekends && (index === 5 || index === 6);

        return (
          <div
            key={day}
            className={cn(
              calendarDrawerStyles.weekdays.label,
              weekdayLabelVariants({ isWeekend })
            )}
            role="columnheader"
            aria-label={getFullWeekdayName(index)}
          >
            {day}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Get full Italian weekday name for accessibility
 * @param index - Day index (0 = Monday, 6 = Sunday)
 * @returns Full Italian weekday name
 */
function getFullWeekdayName(index: number): string {
  const fullNames = [
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
    "Domenica",
  ];
  return fullNames[index] || "";
}
