"use client";

import { cn } from "@/src/lib";
import * as React from "react";
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

  // Mobile: Use Drawer
  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className={cn("p-0", className)}>
        <DrawerHeader className="text-left bg-card px-4 py-3 border-b border-border shrink-0">
          <DrawerTitle className={cn("text-lg font-semibold text-black", titleClassName)}>{title}</DrawerTitle>
          {description && (
            <DrawerDescription className={cn("text-sm text-muted-foreground mt-1", descriptionClassName)}>
              {description}
            </DrawerDescription>
          )}
        </DrawerHeader>

        <div className={cn("px-4 py-3 text-black flex-1 overflow-y-auto", contentClassName)}>
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
