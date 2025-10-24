"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from '@/src/lib';;
import { Button } from "./button";

/**
 * Form Actions Component
 *
 * Pre-styled form footer with Submit/Cancel buttons.
 * Handles loading states and responsive layout.
 *
 * @example
 * ```tsx
 * <FormActions
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   isSubmitting={isLoading}
 *   submitLabel="Salva"
 * />
 * ```
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FormActionsProps {
  /** Submit button click handler */
  onSubmit?: () => void;
  /** Cancel button click handler */
  onCancel?: () => void;
  /** Loading/submitting state */
  isSubmitting?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Submit button label */
  submitLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Show cancel button */
  showCancel?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Submit button variant */
  submitVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  /** Submit button type (button or submit) */
  submitType?: "button" | "submit";
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FormActions({
  onSubmit,
  onCancel,
  isSubmitting = false,
  disabled = false,
  submitLabel = "Salva",
  cancelLabel = "Annulla",
  showCancel = true,
  className,
  submitVariant = "default",
  submitType = "button",
}: FormActionsProps) {
  const isDisabled = disabled || isSubmitting;

  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
    >
      {/* Cancel Button */}
      {showCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className={cn(
            "w-full sm:w-auto",
            "bg-card text-primary border-primary/30 hover:bg-primary/10"
          )}
        >
          {cancelLabel}
        </Button>
      )}

      {/* Submit Button */}
      <Button
        type={submitType}
        variant={submitVariant}
        onClick={submitType === "button" ? onSubmit : undefined}
        disabled={isDisabled}
        className={cn(
          "w-full sm:w-auto"
        )}
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Destructive form actions (for delete operations)
 */
export function DestructiveFormActions({
  onConfirm,
  onCancel,
  isSubmitting = false,
  confirmLabel = "Elimina",
  cancelLabel = "Annulla",
  className,
}: {
  onConfirm?: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string;
}) {
  return (
    <FormActions
      onSubmit={onConfirm}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      submitLabel={confirmLabel}
      cancelLabel={cancelLabel}
      submitVariant="destructive"
      className={className}
    />
  );
}

/**
 * Form actions with custom buttons
 */
export function CustomFormActions({
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

/**
 * Single action button (no cancel)
 */
export function SingleFormAction({
  onSubmit,
  isSubmitting = false,
  disabled = false,
  label = "Continua",
  variant = "default",
  className,
}: {
  onSubmit?: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  label?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
  className?: string;
}) {
  return (
    <FormActions
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      disabled={disabled}
      submitLabel={label}
      submitVariant={variant}
      showCancel={false}
      className={className}
    />
  );
}

// Export types
// Note: avoid re-exporting the same type name to prevent TS duplicate export conflicts.
