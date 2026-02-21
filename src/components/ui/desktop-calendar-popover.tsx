'use client';

import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { calendarDrawerStyles } from '@/lib/styles/calendar-drawer.styles';
import { CalendarPanel } from './calendar-panel';

export interface DesktopCalendarPopoverProps {
  value: string;
  onChange: (date: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

/**
 * Desktop-only anchored calendar popover.
 */
export function DesktopCalendarPopover({
  value,
  onChange,
  isOpen,
  onOpenChange,
  children,
}: Readonly<DesktopCalendarPopoverProps>) {
  const t = useTranslations('Forms.DateDrawer');

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="center"
        side="bottom"
        sideOffset={6}
        collisionPadding={12}
        avoidCollisions={true}
        sticky="always"
        className={calendarDrawerStyles.desktop.popoverContent}
        aria-label={t('drawerAriaLabel')}
      >
        <div className={calendarDrawerStyles.desktop.wrapper}>
          <CalendarPanel value={value} onChange={onChange} onClose={handleClose} size="desktop" />
        </div>
      </PopoverContent>
    </Popover>
  );
}
