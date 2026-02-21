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

import { useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { calendarDrawerStyles } from '@/lib/styles/calendar-drawer.styles';
import { DrawerHandle } from './primitives/date-drawer';
import { CalendarPanel } from './calendar-panel';

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
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
              <CalendarPanel value={value} onChange={onChange} onClose={onClose} size="mobile" />
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
