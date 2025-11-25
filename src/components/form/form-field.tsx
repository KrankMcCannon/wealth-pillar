"use client";

import * as React from "react";
import { cn } from "@/src/lib";
import { Label } from "../ui";

/**
 * Form Field Component
 *
 * Generic form field wrapper with label, input, and error display.
 * Provides consistent styling and accessibility across all forms.
 *
 * @example
 * ```tsx
 * <FormField
 *   label="Email"
 *   error={errors.email}
 *   required
 * >
 *   <Input {...} />
 * </FormField>
 * ```
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FormFieldProps {
  /** Field label text */
  label: string;
  /** Input element (Input, Select, etc.) */
  children: React.ReactNode;
  /** Error message to display */
  error?: string | null;
  /** Mark field as required (shows asterisk) */
  required?: boolean;
  /** Helper text shown below input */
  helperText?: string;
  /** Unique ID for input (for label association) */
  htmlFor?: string;
  /** Additional CSS classes for wrapper */
  className?: string;
  /** Additional CSS classes for label */
  labelClassName?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FormField({
  label,
  children,
  error,
  required = false,
  helperText,
  htmlFor,
  className,
  labelClassName,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <Label
        htmlFor={htmlFor}
        className={cn("text-sm font-medium text-black", error && "text-destructive", labelClassName)}
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>

      {/* Input */}
      <div className="relative">{children}</div>

      {/* Error Message */}
      {error && <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">{error}</p>}

      {/* Helper Text */}
      {helperText && !error && <p className="text-sm text-black/70">{helperText}</p>}
    </div>
  );
}

// Export type for external use
// Note: avoid re-exporting the same type name to prevent TS duplicate export conflicts.
