'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from './drawer';
import { modalWrapperStyles } from './theme/modal-wrapper-styles';
import { Loader2 } from 'lucide-react';

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
}: Readonly<ModalWrapperProps>) {
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  // Focus management
  const handleOpenAutoFocus = React.useCallback((event: Event) => {
    event.preventDefault();
    contentRef.current?.focus();
  }, []);

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
          ref={contentRef}
          tabIndex={-1}
          onOpenAutoFocus={handleOpenAutoFocus}
          showCloseButton={showCloseButton}
          className={cn('max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden', maxWidth, className)}
        >
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className={cn(modalWrapperStyles.dialogTitle, titleClassName)}>
              {title}
            </DialogTitle>
            {description ? (
              <DialogDescription
                className={cn(modalWrapperStyles.dialogDescription, descriptionClassName)}
              >
                {description}
              </DialogDescription>
            ) : (
              <DialogDescription className={modalWrapperStyles.dialogDescriptionHidden}>
                {title}
              </DialogDescription>
            )}
          </DialogHeader>

          {isLoading ? (
            <div className={cn(modalWrapperStyles.loadingWrap, 'flex-1')}>
              <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
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
        ref={contentRef}
        tabIndex={-1}
        onOpenAutoFocus={handleOpenAutoFocus}
        className={cn(
          modalWrapperStyles.drawerContent,
          'h-[96dvh] mt-24 rounded-t-[10px] p-0 flex flex-col overflow-hidden',
          className
        )}
      >
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-primary/10 shrink-0" />
        <DrawerHeader className={cn(modalWrapperStyles.drawerHeader, 'shrink-0')}>
          <DrawerTitle className={cn(modalWrapperStyles.drawerTitle, titleClassName)}>
            {title}
          </DrawerTitle>
          {description ? (
            <DrawerDescription
              className={cn(modalWrapperStyles.drawerDescription, descriptionClassName)}
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
          <div className={cn(modalWrapperStyles.loadingWrap, 'flex-1')}>
            <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">{children}</div>
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
    <div className={cn('flex-1 flex flex-col gap-6 px-4 sm:px-6 py-4 overflow-y-auto', className)}>
      {children}
    </div>
  );
}

/**
 * Footer actions container.
 * Automatically adapts to Dialog (right-aligned) vs Drawer (full-width stack) via CSS parent context or media query if needed.
 * But we'll standardise it here.
 */
export function ModalFooter({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  // Mobile drawer usually needs a bit more padding at bottom for safe area
  return (
    <div
      className={cn(
        'mt-auto px-4 sm:px-6 py-4 border-t border-border flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-2 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4',
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
    <div className={cn('flex flex-col gap-4', className)}>
      {title && (
        <h4 className="text-xs font-semibold text-primary/60 uppercase tracking-wider shrink-0 mb-1">
          {title}
        </h4>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
