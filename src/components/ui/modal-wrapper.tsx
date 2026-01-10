"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./drawer";
import { modalWrapperStyles } from "./theme/modal-wrapper-styles";

/**
 * Modal Wrapper Component
 *
 * Unified modal component that automatically switches between Dialog (desktop)
 * and Drawer (mobile) based on screen size.
 */

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
  /** Optional footer content (buttons, actions, etc.) */
  footer?: React.ReactNode;
  /** Maximum width of the modal */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  /** Show/hide the close button (default: true) */
  showCloseButton?: boolean;
  /** Additional CSS classes for the modal container */
  className?: string;
  /** Additional CSS classes for the content area */
  contentClassName?: string;
  /** Additional CSS classes for the title */
  titleClassName?: string;
  /** Additional CSS classes for the description */
  descriptionClassName?: string;
  /** Loading state - shows loading indicator */
  isLoading?: boolean;
  /** Disable closing on outside click/Esc (default: false) */
  disableOutsideClose?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ModalWrapper({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
  titleClassName,
  descriptionClassName,
  showCloseButton = true,
  isLoading = false,
  disableOutsideClose = false,
}: ModalWrapperProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  // Prevent closing if disabled
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
        <DialogContent showCloseButton={showCloseButton} className={className}>
          <DialogHeader className={modalWrapperStyles.dialogHeader}>
            <DialogTitle className={cn(modalWrapperStyles.dialogTitle, titleClassName)}>{title}</DialogTitle>
            {description ? (
              <DialogDescription className={cn(modalWrapperStyles.dialogDescription, descriptionClassName)}>
                {description}
              </DialogDescription>
            ) : (
              <DialogDescription className={modalWrapperStyles.dialogDescriptionHidden}>{title}</DialogDescription>
            )}
          </DialogHeader>

          <div className={cn(modalWrapperStyles.content, contentClassName)}>
            {isLoading ? (
              <div className={modalWrapperStyles.loadingWrap}>
                <div className={modalWrapperStyles.loadingDot} />
                <span className={modalWrapperStyles.loadingText}>Caricamento...</span>
              </div>
            ) : (
              children
            )}
          </div>

          {footer && !isLoading && (
            <DialogFooter>{footer}</DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className={cn(modalWrapperStyles.drawerContent, className)} aria-describedby={undefined}>
        <DrawerHeader className={modalWrapperStyles.drawerHeader}>
          <DrawerTitle className={cn(modalWrapperStyles.drawerTitle, titleClassName)}>{title}</DrawerTitle>
          {description ? (
            <DrawerDescription className={cn(modalWrapperStyles.drawerDescription, descriptionClassName)}>
              {description}
            </DrawerDescription>
          ) : (
            <DrawerDescription className={modalWrapperStyles.dialogDescriptionHidden}>
              {title}
            </DrawerDescription>
          )}
        </DrawerHeader>

        <div className={cn(modalWrapperStyles.drawerContentBody, contentClassName)}>
          {isLoading ? (
            <div className={modalWrapperStyles.loadingWrap}>
              <div className={modalWrapperStyles.loadingDot} />
              <span className={modalWrapperStyles.loadingText}>Caricamento...</span>
            </div>
          ) : (
            children
          )}
        </div>

        {footer && !isLoading && (
          <DrawerFooter className={modalWrapperStyles.drawerFooter}>{footer}</DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Pre-styled modal content wrapper for consistent spacing
 */
export function ModalContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col", className)}>{children}</div>;
}

/**
 * Pre-styled modal section with optional title
 */
export function ModalSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {title && <h4 className="text-xs font-semibold text-black/80 uppercase tracking-wide shrink-0">{title}</h4>}
      {children}
    </div>
  );
}

/**
 * Pre-styled modal footer with action buttons
 */
export function ModalActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}>{children}</div>;
}

// Export type for external use
// Note: avoid re-exporting the same type name to prevent TS duplicate export conflicts.
