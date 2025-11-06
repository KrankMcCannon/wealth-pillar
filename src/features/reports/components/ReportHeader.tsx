"use client";

import React from "react";
import { Button } from "@/src/components/ui";
import { ArrowLeft, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { reportsStyles } from "@/features/reports";

/**
 * Report Header Component
 * Displays the report title, month/year selector, and export button
 */

export interface ReportHeaderProps {
  /** Current month being displayed */
  month: Date;
  /** Callback when user clicks back button */
  onBackClick: () => void;
  /** Callback when previous month is selected */
  onPreviousMonth: () => void;
  /** Callback when next month is selected */
  onNextMonth: () => void;
  /** Callback when export is clicked */
  onExport?: () => void;
}

export function ReportHeader({
  month,
  onBackClick,
  onPreviousMonth,
  onNextMonth,
  onExport,
}: Readonly<ReportHeaderProps>) {
  const monthLabel = month.toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  return (
    <div className={reportsStyles.header.container}>
      <div className={reportsStyles.header.inner}>
        <Button
          variant="ghost"
          size="sm"
          className={reportsStyles.header.button}
          onClick={onBackClick}
        >
          <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>

        <div className="flex-1 flex flex-col items-center">
          <h1 className={reportsStyles.header.title}>Rapporti</h1>
          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className={reportsStyles.header.button}
              onClick={onPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs sm:text-sm font-medium text-muted-foreground capitalize">
              {monthLabel}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className={reportsStyles.header.button}
              onClick={onNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {onExport && (
          <Button
            variant="ghost"
            size="sm"
            className={reportsStyles.header.button}
            onClick={onExport}
          >
            <Download className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
