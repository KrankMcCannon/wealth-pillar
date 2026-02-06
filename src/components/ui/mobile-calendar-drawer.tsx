/**
 * Mobile Calendar Drawer Component
 *
 * Main orchestrator for mobile calendar bottom drawer
 * Follows iOS/Android bottom sheet conventions
 *
 * Features:
 * - Bottom drawer with spring animations
 * - Swipe-to-dismiss gesture
 * - Month navigation with swipe detection
 * - Quick preset shortcuts
 * - Italian locale throughout
 * - Full keyboard navigation
 * - WCAG AA accessibility
 */

'use client';

import { useState, useCallback } from 'react';
import { format, addMonths, subMonths, isValid, startOfYear } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { calendarDrawerStyles } from '@/lib/styles/calendar-drawer.styles';
import {
  DrawerHandle,
  WeekdayLabels,
  MonthGrid,
  MonthHeader,
  QuickPresets,
} from './primitives/date-drawer';

export interface MobileCalendarDrawerProps {
  /**
   * Current date value (YYYY-MM-DD format for API compatibility)
   */
  value: string;

  /**
   * Callback when date is selected (returns YYYY-MM-DD format)
   */
  onChange: (date: string) => void;

  /**
   * Whether drawer is open
   */
  isOpen: boolean;

  /**
   * Callback to close drawer
   */
  onClose: () => void;
}

/**
 * MobileCalendarDrawer - Bottom sheet date picker
 *
 * Complete mobile calendar experience with:
 * - Bottom drawer UI pattern
 * - Touch-optimized interactions
 * - Smooth animations
 * - Keyboard navigation
 * - Accessibility features
 *
 * @example
 * ```tsx
 * <MobileCalendarDrawer
 *   value={formData.date}
 *   onChange={(date) => setFormData({ ...formData, date })}
 *   isOpen={isDrawerOpen}
 *   onClose={() => setIsDrawerOpen(false)}
 * />
 * ```
 */
export function MobileCalendarDrawer({
  value,
  onChange,
  isOpen,
  onClose,
}: Readonly<MobileCalendarDrawerProps>) {
  const t = useTranslations('Forms.DateDrawer');
  // Parse current value to Date (or use today if empty)
  const selectedDate = value && isValid(new Date(value)) ? new Date(value) : undefined;

  // Current month being viewed (start with selected month or start of current year)
  const [currentMonth, setCurrentMonth] = useState(() => {
    return selectedDate || startOfYear(new Date());
  });

  // Navigate to previous month
  const handlePrevious = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  // Navigate to next month
  const handleNext = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  // Handle direct month/year selection from dropdown
  const handleMonthYearChange = useCallback((newDate: Date) => {
    setCurrentMonth(newDate);
  }, []);

  // Handle date selection
  const handleDateSelect = useCallback(
    (date: Date) => {
      // Convert to YYYY-MM-DD format for API compatibility
      const formattedDate = format(date, 'yyyy-MM-dd');
      onChange(formattedDate);
      onClose();
    },
    [onChange, onClose]
  );

  // Handle preset selection
  const handlePresetSelect = useCallback(
    (date: Date) => {
      // Update current month to show selected date
      setCurrentMonth(date);
      // Select the date
      handleDateSelect(date);
    },
    [handleDateSelect]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className={calendarDrawerStyles.drawer.overlay} />

        {/* Drawer Content */}
        <Dialog.Content
          className={calendarDrawerStyles.drawer.content}
          onKeyDown={handleKeyDown}
          aria-label={t('drawerAriaLabel')}
        >
          {/* Hidden title for accessibility */}
          <Dialog.Title className={calendarDrawerStyles.accessibility.srOnly}>
            {t('drawerTitle')}
          </Dialog.Title>

          {/* Drag Handle */}
          <DrawerHandle />

          {/* Scrollable Content */}
          <div className={calendarDrawerStyles.drawer.wrapper}>
            <div className={calendarDrawerStyles.drawer.scrollArea}>
              {/* Month Navigation Header */}
              <MonthHeader
                currentMonth={currentMonth}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onMonthChange={handleMonthYearChange}
              />

              {/* Weekday Labels */}
              <WeekdayLabels highlightWeekends />

              {/* Calendar Grid */}
              <MonthGrid
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                size="mobile"
              />

              {/* Quick Presets */}
              <QuickPresets selectedDate={selectedDate} onSelect={handlePresetSelect} />
            </div>
          </div>

          {/* Live region for screen reader announcements */}
          <output
            className={calendarDrawerStyles.accessibility.liveRegion}
            aria-live="polite"
            aria-atomic="true"
          >
            {/* This will be populated by month changes */}
          </output>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
