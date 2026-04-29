'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from './drawer';
import { modalWrapperStyles } from './theme/modal-wrapper-styles';
import { Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ModalWrapperProps {
  /** Controls modal open/close state */
  isOpen: boolean;
  /** Callback when modal state changes */
  onOpenChange: (open: boolean) => void;
  /** Modal title (required for accessibility) */
  title: string;
  /** Optional description for additional context */
  description?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Maximum width of the modal */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Show/hide the close button (default: true) */
  showCloseButton?: boolean;
  /** Additional CSS classes for the modal container */
  className?: string;
  /** Additional CSS classes for the title */
  titleClassName?: string;
  /** Additional CSS classes for the description */
  descriptionClassName?: string;
  /** Loading state - shows loading indicator */
  isLoading?: boolean;
  /** Disable closing on outside click/Esc (default: false) */
  disableOutsideClose?: boolean;
  /**
   * Mobile-specific: Reposition inputs to avoid keyboard overlap.
   * Set to `false` if inputs are flying off screen or handling it manually.
   * Default: `false` (Fixed behavior)
   */
  repositionInputs?: boolean;
  /** Drag handle on mobile drawer (visual only) */
  handleClassName?: string;
  /** Extra classes on mobile `DrawerHeader` (e.g. Stitch chrome) */
  drawerHeaderClassName?: string;
  /** Extra classes on mobile `DrawerClose` button */
  drawerCloseClassName?: string;
}

// ============================================================================
// ROOT COMPONENT
// ============================================================================

export function ModalWrapper({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  className,
  titleClassName,
  descriptionClassName,
  showCloseButton = true,
  isLoading = false,
  disableOutsideClose = false,
  repositionInputs = false,
  maxWidth,
  handleClassName,
  drawerHeaderClassName,
  drawerCloseClassName,
}: Readonly<ModalWrapperProps>) {
  const tCommon = useTranslations('Common');
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const dialogDescriptionId = React.useId();

  // Prevent closing logic
  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (disableOutsideClose && !open) {
        return; // Prevent closing
      }
      onOpenChange(open);
    },
    [disableOutsideClose, onOpenChange]
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={showCloseButton}
          aria-describedby={dialogDescriptionId}
          className={cn('max-h-[90vh] flex flex-col p-0 gap-0', maxWidth, className)}
        >
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className={cn(modalWrapperStyles.dialogTitle, titleClassName)}>
              {title}
            </DialogTitle>
            {description ? (
              <DialogDescription
                id={dialogDescriptionId}
                className={cn(modalWrapperStyles.dialogDescription, descriptionClassName)}
              >
                {description}
              </DialogDescription>
            ) : (
              <DialogDescription
                id={dialogDescriptionId}
                className={modalWrapperStyles.dialogDescriptionHidden}
              >
                {title}
              </DialogDescription>
            )}
          </DialogHeader>

          {isLoading ? (
            <div className={modalWrapperStyles.loadingWrap}>
              <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-2">{children}</div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile Drawer
  return (
    <Drawer
      open={isOpen}
      onOpenChange={handleOpenChange}
      repositionInputs={repositionInputs} // Fix for keyboard issue
    >
      <DrawerContent
        className={cn(
          modalWrapperStyles.drawerContent,
          'mt-24 max-h-[96dvh] min-h-0 rounded-t-[32px]',
          className
        )}
      >
        <div
          className={cn(
            'mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-primary/20',
            handleClassName
          )}
          aria-hidden
        />
        <DrawerHeader
          className={cn(
            modalWrapperStyles.drawerHeader,
            'flex flex-col gap-2 border-b border-primary/10 bg-card px-4 py-3',
            drawerHeaderClassName
          )}
        >
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <DrawerTitle className={cn(modalWrapperStyles.drawerTitle, titleClassName)}>
              {title}
            </DrawerTitle>
            {showCloseButton ? (
              <DrawerClose
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-card text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                  drawerCloseClassName
                )}
              >
                <X className="h-5 w-5" aria-hidden />
                <span className="sr-only">{tCommon('closeDialog')}</span>
              </DrawerClose>
            ) : null}
          </div>
          {description ? (
            <DrawerDescription
              className={cn(
                modalWrapperStyles.drawerDescription,
                descriptionClassName,
                'text-left'
              )}
            >
              {description}
            </DrawerDescription>
          ) : (
            <DrawerDescription className={modalWrapperStyles.dialogDescriptionHidden}>
              {title}
            </DrawerDescription>
          )}
        </DrawerHeader>

        {isLoading ? (
          <div className={modalWrapperStyles.loadingWrap}>
            <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
          </div>
        ) : (
          <div className={cn(modalWrapperStyles.drawerContentBody, 'min-h-0')}>{children}</div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

// ============================================================================
// SUB-COMPONENTS (Compound Pattern Helpers)
// ============================================================================

/**
 * Container for the distinct sections of a modal form/content.
 * Use inside ModalWrapper > form or just ModalWrapper
 */
export function ModalBody({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div className={cn('min-h-0 flex-1 overflow-y-auto py-2 space-y-4', className)}>{children}</div>
  );
}

/**
 * Footer actions container.
 * Automatically adapts to Dialog (right-aligned) vs Drawer (full-width stack) via CSS parent context or media query if needed.
 * But we'll standardize it here.
 */
export function ModalFooter({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  // Mobile drawer usually needs a bit more padding at bottom for safe area
  return (
    <div
      className={cn(
        'mt-auto shrink-0 border-t border-border bg-card/95 py-4 pt-4 backdrop-blur-sm supports-backdrop-filter:bg-card/90 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:pb-4',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Section grouping for content
 */
export function ModalSection({
  title,
  children,
  className,
}: Readonly<{
  title?: string;
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {title && (
        <h3 className="text-xs font-semibold text-primary/60 uppercase tracking-wider">{title}</h3>
      )}
      {children}
    </div>
  );
}
