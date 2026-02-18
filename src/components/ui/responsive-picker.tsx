'use client';

import * as React from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

interface ResponsivePickerProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  contentClassName?: string;
  align?: 'start' | 'center' | 'end';
}

/**
 * ResponsivePicker Component
 * 
 * High-level component that renders a Popover on desktop (>= 768px)
 * and a Drawer on mobile (< 768px).
 * 
 * Ideal for date pickers, selects, and other input-related overlays.
 */
export function ResponsivePicker({
  children,
  trigger,
  open,
  onOpenChange,
  className,
  contentClassName,
  align = 'start',
}: ResponsivePickerProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent 
          className={cn('w-auto p-0', contentClassName)} 
          align={align}
        >
          {children}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className={cn('p-0', contentClassName)}>
        <div className="mx-auto w-full max-w-sm flex flex-col items-center justify-center p-4">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
