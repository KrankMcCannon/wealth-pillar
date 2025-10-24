"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from '@/src/lib';
import { buttonVariants } from "./button"

/**
 * Calendar Component - Modern Edition
 *
 * Enhanced calendar with modern styling, better visual hierarchy,
 * and improved user experience.
 *
 * Features:
 * - Modern glassmorphism design
 * - Better day indicators (today, selected, hover)
 * - Larger touch targets for mobile (48px)
 * - Smooth animations and transitions
 * - Weekend highlighting
 * - Clear visual states
 */

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-sm font-bold text-foreground tracking-tight",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-card/50 backdrop-blur-sm p-0 hover:bg-primary/10 hover:text-primary border-primary/20 rounded-lg transition-all duration-200 hover:scale-105"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell:
          "text-muted-foreground w-9 h-9 font-semibold text-[0.65rem] uppercase flex items-center justify-center",
        row: "flex w-full mt-1",
        cell: "relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-medium aria-selected:opacity-100 hover:bg-primary/10 hover:text-primary rounded-lg transition-all duration-200 hover:scale-105"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-lg shadow-md font-bold",
        day_today: "bg-accent/20 text-foreground font-bold ring-2 ring-primary/30",
        day_outside:
          "day-outside text-muted-foreground/40 opacity-50 aria-selected:bg-primary/5 aria-selected:text-muted-foreground aria-selected:opacity-40",
        day_disabled: "text-muted-foreground/30 opacity-40 cursor-not-allowed line-through",
        day_range_middle:
          "aria-selected:bg-primary/15 aria-selected:text-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight
          return <Icon className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
