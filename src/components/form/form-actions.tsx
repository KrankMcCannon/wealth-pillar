'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib';
import { Button } from '../ui';
import { formStyles } from './theme/form-styles';

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
  submitVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  /** Submit button type (button or submit) */
  submitType?: 'button' | 'submit';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FormActions({
  onSubmit,
  onCancel,
  isSubmitting = false,
  disabled = false,
  submitLabel,
  cancelLabel,
  showCancel = true,
  className,
  submitVariant = 'default',
  submitType = 'button',
}: Readonly<FormActionsProps>) {
  const t = useTranslations('Forms.Actions');
  const isDisabled = disabled || isSubmitting;
  const resolvedSubmitLabel = submitLabel ?? t('save');
  const resolvedCancelLabel = cancelLabel ?? t('cancel');

  return (
    <div className={cn(formStyles.actions.container, className)}>
      {/* Cancel Button */}
      {showCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className={cn(formStyles.actions.buttonBase, formStyles.actions.cancel)}
        >
          {resolvedCancelLabel}
        </Button>
      )}

      {/* Submit Button */}
      <Button
        type={submitType}
        variant={submitVariant}
        onClick={submitType === 'button' ? onSubmit : undefined}
        disabled={isDisabled}
        className={cn(formStyles.actions.buttonBase)}
      >
        {isSubmitting && <Loader2 className={formStyles.actions.loadingIcon} />}
        {resolvedSubmitLabel}
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
  confirmLabel,
  cancelLabel,
  className,
}: Readonly<{
  onConfirm?: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string;
}>) {
  const t = useTranslations('Forms.Actions');
  return (
    <FormActions
      onSubmit={onConfirm}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      submitLabel={confirmLabel ?? t('delete')}
      cancelLabel={cancelLabel ?? t('cancel')}
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
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return <div className={cn(formStyles.actions.container, className)}>{children}</div>;
}

/**
 * Single action button (no cancel)
 */
export function SingleFormAction({
  onSubmit,
  isSubmitting = false,
  disabled = false,
  label,
  variant = 'default',
  className,
}: Readonly<{
  onSubmit?: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  label?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  className?: string;
}>) {
  const t = useTranslations('Forms.Actions');
  return (
    <FormActions
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      disabled={disabled}
      submitLabel={label ?? t('continue')}
      submitVariant={variant}
      showCancel={false}
      className={className}
    />
  );
}
