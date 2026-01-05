"use client";

import { memo, useCallback, useMemo } from 'react';
import { Calendar, Infinity } from "lucide-react";

interface YearSelectorProps {
  className?: string;
  selectedYear: number | 'all';
  onYearChange: (year: number | 'all') => void;
  availableYears: number[];
  isLoading?: boolean;
}

/**
 * YearSelector Component
 * Allows users to select a specific year or "all time" for data visualization
 * Follows the same design pattern as UserSelector
 */
const YearSelector = memo(({
  className = "",
  selectedYear,
  onYearChange,
  availableYears,
  isLoading = false,
}: YearSelectorProps) => {
  // Memoized year list with "All Time" option
  const yearsList = useMemo(() => {
    // Sort years descending (most recent first)
    const sortedYears = [...availableYears].sort((a, b) => b - a);

    return [
      {
        id: 'all' as const,
        label: 'Tutti i Tempi',
        icon: Infinity,
        isSpecial: true
      },
      ...sortedYears.map(year => ({
        id: year,
        label: year.toString(),
        icon: Calendar,
        isSpecial: false
      }))
    ];
  }, [availableYears]);

  // Memoized click handler
  const handleYearClick = useCallback((yearId: number | 'all') => {
    if (yearId !== selectedYear) {
      onYearChange(yearId);
    }
  }, [selectedYear, onYearChange]);

  // Don't show if no years available
  if (availableYears.length === 0 && !isLoading) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <section className={`bg-card/80 backdrop-blur-xl p-2 border-b border-primary/20 shadow-sm ${className}`}>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 flex items-center gap-2 p-2 rounded-2xl bg-primary/10 border border-primary/20 min-w-[100px] animate-pulse"
            >
              <div className="w-5 h-5 bg-primary/20 rounded-full"></div>
              <div className="w-12 h-4 bg-primary/15 rounded"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={`bg-card/80 backdrop-blur-xl py-3 border-b border-primary/20 shadow-sm ${className}`}>
      <div
        className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/40 scrollbar-thumb-rounded-full pl-4"
        style={{
          scrollbarWidth: 'thin',
          height: '44px',
        }}
      >
        {yearsList.map((yearItem) => {
          const IconComponent = yearItem.icon;
          const isSelected = selectedYear === yearItem.id;

          return (
            <button
              key={yearItem.id}
              onClick={() => handleYearClick(yearItem.id)}
              className={`
                shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-semibold
                whitespace-nowrap transition-all duration-300 group hover:scale-[1.02]
                focus:outline-none
                ${isSelected
                  ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                  : "bg-primary/10 backdrop-blur-sm text-primary hover:bg-primary/12 hover:text-primary hover:shadow-sm hover:shadow-primary/10"
                }
              `}
              disabled={isLoading}
              aria-pressed={isSelected}
              aria-label={`Seleziona ${yearItem.label}`}
            >
              <div className={`
                flex items-center justify-center w-5 h-5 rounded-full
                transition-all duration-200 group-hover:scale-105
                ${isSelected
                  ? 'bg-white/20 backdrop-blur-sm'
                  : 'bg-primary/20'
                }
              `}>
                <IconComponent
                  className={`w-3.5 h-3.5 transition-colors duration-200 ${
                    isSelected ? 'text-white' : 'text-primary'
                  }`}
                />
              </div>

              <span className="transition-all duration-200">
                {yearItem.label}
              </span>

              {/* Hover indicator only for non-selected */}
              {!isSelected && (
                <div className="w-0 h-2 bg-primary/40 rounded-full transition-all duration-300 group-hover:w-2 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selection indicator dots (for visual feedback) */}
      {yearsList.length > 3 && (
        <div className="flex justify-center mt-2 gap-1">
          {yearsList.slice(0, Math.min(yearsList.length, 5)).map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === yearsList.findIndex(y => y.id === selectedYear)
                  ? 'bg-primary w-4'
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
});

YearSelector.displayName = 'YearSelector';

export default YearSelector;
