"use client";

import { cn } from "@/src/lib";
import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./drawer";

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
  maxWidth = "md",
  showCloseButton = true,
  className,
  contentClassName,
  isLoading = false,
  disableOutsideClose = false,
}: ModalWrapperProps) {
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

  // Get max width class based on size
  const getMaxWidthClass = () => {
    const widthMap = {
      sm: "sm:max-w-sm",
      md: "sm:max-w-md",
      lg: "sm:max-w-lg",
      xl: "sm:max-w-xl",
      full: "sm:max-w-full",
    };
    return widthMap[maxWidth];
  };

  // Desktop: Use Dialog
  if (false) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(getMaxWidthClass(), "p-0", className)}
          showCloseButton={showCloseButton && !isLoading}
        >
          <DialogHeader className="rounded-t-2xl px-5 py-4 bg-card border-b border-border shrink-0">
            <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-sm text-muted-foreground mt-1">{description}</DialogDescription>
            )}
          </DialogHeader>

          <div className={cn("px-6 py-4 text-foreground flex-1 overflow-y-auto", contentClassName)}>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="liquid-pulse size-8 rounded-full bg-primary/20" />
                <span className="ml-3 text-sm text-muted-foreground">Caricamento...</span>
              </div>
            ) : (
              children
            )}
          </div>

          {footer && !isLoading && (
            <DialogFooter className="px-6 py-4 border-t border-border bg-card rounded-b-2xl shrink-0">
              {footer}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Use Drawer
  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className={cn("p-0", className)}>
        <DrawerHeader className="text-left bg-card px-4 py-3 border-b border-border shrink-0">
          <DrawerTitle className="text-lg font-semibold text-foreground">{title}</DrawerTitle>
          {description && (
            <DrawerDescription className="text-sm text-muted-foreground mt-1">{description}</DrawerDescription>
          )}
        </DrawerHeader>

        <div className={cn("px-4 py-3 text-foreground flex-1 overflow-y-auto", contentClassName)}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="liquid-pulse size-8 rounded-full bg-primary/20" />
              <span className="ml-3 text-sm text-muted-foreground">Caricamento...</span>
            </div>
          ) : (
            children
          )}
        </div>

        {footer && !isLoading && (
          <DrawerFooter className="pt-3 pb-4 px-4 border-t border-border bg-card shrink-0">{footer}</DrawerFooter>
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
  return <div className={cn("flex flex-col gap-2", className)}>{children}</div>;
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
      {title && <h4 className="text-xs font-semibold text-foreground/80 uppercase tracking-wide shrink-0">{title}</h4>}
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
