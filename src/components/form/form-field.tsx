'use client';

import * as React from 'react';
import { cn } from '@/lib';
import { Label } from '../ui';
import { formStyles } from './theme/form-styles';

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
}: Readonly<FormFieldProps>) {
  return (
    <div className={cn(formStyles.field.container, className)}>
      {/* Label */}
      <Label
        htmlFor={htmlFor}
        className={cn(formStyles.field.label, error && formStyles.field.labelError, labelClassName)}
      >
        {label}
        {required && <span className={formStyles.field.required}>*</span>}
      </Label>

      {/* Input */}
      <div className={formStyles.field.inputWrap}>{children}</div>

      {/* Error Message */}
      {error && <p className={formStyles.field.error}>{error}</p>}

      {/* Helper Text */}
      {helperText && !error && <p className={formStyles.field.helper}>{helperText}</p>}
    </div>
  );
}
