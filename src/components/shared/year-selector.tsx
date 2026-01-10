"use client";

import { memo, useCallback, useMemo } from 'react';
import { Calendar, Infinity } from "lucide-react";
import { yearSelectorStyles } from './theme/year-selector-styles';

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
      <section className={`${yearSelectorStyles.loading.container} ${className}`}>
        <div className={yearSelectorStyles.loading.list}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={yearSelectorStyles.loading.item}
            >
              <div className={yearSelectorStyles.loading.icon}></div>
              <div className={yearSelectorStyles.loading.text}></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={`${yearSelectorStyles.container} ${className}`}>
      <div
        className={yearSelectorStyles.list}
        style={yearSelectorStyles.listStyle}
      >
        {yearsList.map((yearItem) => {
          const IconComponent = yearItem.icon;
          const isSelected = selectedYear === yearItem.id;

          return (
            <button
              key={yearItem.id}
              onClick={() => handleYearClick(yearItem.id)}
              className={`${yearSelectorStyles.item.base} ${isSelected
                ? yearSelectorStyles.item.active
                : yearSelectorStyles.item.inactive
                }`}
              disabled={isLoading}
              aria-pressed={isSelected}
              aria-label={`Seleziona ${yearItem.label}`}
            >
              <div className={`${yearSelectorStyles.icon.containerBase} ${isSelected
                ? yearSelectorStyles.icon.containerActive
                : yearSelectorStyles.icon.containerInactive
                }`}>
                <IconComponent
                  className={`${yearSelectorStyles.icon.svgBase} ${
                    isSelected ? yearSelectorStyles.icon.svgActive : yearSelectorStyles.icon.svgInactive
                  }`}
                />
              </div>

              <span className={yearSelectorStyles.label}>
                {yearItem.label}
              </span>

              {/* Hover indicator only for non-selected */}
              {!isSelected && (
                <div className={yearSelectorStyles.hoverIndicator} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selection indicator dots (for visual feedback) */}
      {yearsList.length > 3 && (
        <div className={yearSelectorStyles.dots.container}>
          {yearsList.slice(0, Math.min(yearsList.length, 5)).map((_, index) => (
            <div
              key={index}
              className={`${yearSelectorStyles.dots.base} ${
                index === yearsList.findIndex(y => y.id === selectedYear)
                  ? yearSelectorStyles.dots.active
                  : yearSelectorStyles.dots.inactive
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
