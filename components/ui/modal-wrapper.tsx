"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/**
 * Modal Wrapper Component
 *
 * Unified modal component that automatically switches between Dialog (desktop)
 * and Drawer (mobile) based on screen size. Provides consistent modal behavior
 * across the application.
 *
 * @example
 * ```tsx
 * <ModalWrapper
 *   isOpen={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Create Transaction"
 *   description="Add a new transaction to your account"
 * >
 *   <FormContent />
 * </ModalWrapper>
 * ```
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
  // Detect if device is desktop or mobile
  const isDesktop = useMediaQuery("(min-width: 768px)");

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
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            getMaxWidthClass(),
            "p-0 rounded-2xl border border-primary/20 bg-card shadow-2xl",
            className
          )}
          showCloseButton={showCloseButton && !isLoading}
        >
          <DialogHeader className="rounded-t-2xl p-5 bg-card border-b border-primary/20">
            <DialogTitle className="text-lg font-semibold text-foreground">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-sm text-muted-foreground">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className={cn("space-y-4 px-6 py-5 text-foreground", contentClassName)}>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="liquid-pulse size-8 rounded-full bg-primary/20" />
                <span className="ml-3 text-sm text-muted-foreground">
                  Caricamento...
                </span>
              </div>
            ) : (
              children
            )}
          </div>

          {footer && !isLoading && (
            <DialogFooter className="px-6 py-4 border-t border-primary/20 bg-card rounded-b-2xl">
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
      <DrawerContent
        className={cn(
          "rounded-t-3xl max-h-[95vh] p-0 border-t border-primary/20 bg-card",
          className
        )}
      >
        {/* Drawer handle */}
        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-primary/30 mt-4" />

        <DrawerHeader className="text-left bg-card px-4 py-4 border-b border-primary/20">
          <DrawerTitle className="text-lg font-semibold text-foreground">
            {title}
          </DrawerTitle>
          {description && (
            <DrawerDescription className="text-sm text-muted-foreground">
              {description}
            </DrawerDescription>
          )}
        </DrawerHeader>

        <div className={cn("px-4 pb-4 overflow-y-auto text-foreground", contentClassName)}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="liquid-pulse size-8 rounded-full bg-primary/20" />
              <span className="ml-3 text-sm text-muted-foreground">
                Caricamento...
              </span>
            </div>
          ) : (
            children
          )}
        </div>

        {footer && !isLoading && (
          <DrawerFooter className="pt-4 border-t border-primary/20 bg-card rounded-full">{footer}</DrawerFooter>
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
export function ModalContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
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
    <div className={cn("space-y-3", className)}>
      {title && (
        <h4 className="text-sm font-medium">{title}</h4>
      )}
      {children}
    </div>
  );
}

/**
 * Pre-styled modal footer with action buttons
 */
export function ModalActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
    >
      {children}
    </div>
  );
}

// Export type for external use
// Note: avoid re-exporting the same type name to prevent TS duplicate export conflicts.
