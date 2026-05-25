'use client';

import type { ReactNode } from 'react';
import { Check, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formModalStyles as s } from '@/components/form/form-modal-styles';
import { cn } from '@/lib/utils';

type SubmitVariant = 'default' | 'destructive';

interface ModalFooterActionsBase {
  isSubmitting?: boolean;
  disabled?: boolean;
  submitType?: 'button' | 'submit';
  className?: string;
}

export interface ModalFooterStackedPrimaryProps extends ModalFooterActionsBase {
  variant: 'stacked-primary';
  submitLabel: string;
  showSubmitIcon?: boolean;
  showSubmitSpinner?: boolean;
  secondaryAction?: ReactNode;
  deleteLabel?: string;
  onDelete?: () => void;
  deleteTestId?: string;
}

export interface ModalFooterDualProps extends ModalFooterActionsBase {
  variant: 'dual';
  submitLabel: string;
  cancelLabel: string;
  onCancel: () => void;
  onSubmit?: () => void;
  submitVariant?: SubmitVariant;
  submitDisabled?: boolean;
  submitIcon?: ReactNode;
}

export type ModalFooterActionsProps = ModalFooterStackedPrimaryProps | ModalFooterDualProps;

export function ModalFooterActions(props: Readonly<ModalFooterActionsProps>) {
  if (props.variant === 'stacked-primary') {
    return <StackedPrimaryFooter {...props} />;
  }
  return <DualFooter {...props} />;
}

function StackedPrimaryFooter({
  submitLabel,
  isSubmitting = false,
  disabled = false,
  submitType = 'submit',
  showSubmitIcon = true,
  showSubmitSpinner = false,
  secondaryAction,
  deleteLabel,
  onDelete,
  deleteTestId,
  className,
}: Readonly<ModalFooterStackedPrimaryProps>) {
  const busy = disabled || isSubmitting;

  return (
    <div className={cn(s.footer.actionsStack, className)}>
      <button type={submitType} disabled={busy} className={s.primaryCta} aria-busy={isSubmitting}>
        {showSubmitSpinner && isSubmitting ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
        ) : showSubmitIcon ? (
          <Check className="h-5 w-5 shrink-0" aria-hidden />
        ) : null}
        {submitLabel}
      </button>
      {secondaryAction}
      {onDelete && deleteLabel ? (
        <button
          type="button"
          data-testid={deleteTestId}
          disabled={busy}
          onClick={onDelete}
          className={s.deleteButton}
        >
          <Trash2 className="h-5 w-5 shrink-0" aria-hidden />
          {deleteLabel}
        </button>
      ) : null}
    </div>
  );
}

function DualFooter({
  submitLabel,
  cancelLabel,
  onCancel,
  onSubmit,
  isSubmitting = false,
  disabled = false,
  submitType = 'button',
  submitVariant = 'default',
  submitDisabled = false,
  submitIcon,
  className,
}: Readonly<ModalFooterDualProps>) {
  const busy = disabled || isSubmitting;
  const isConfirmDisabled = busy || submitDisabled;

  return (
    <div className={cn(s.footer.dualRow, className)}>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
        className={s.footer.dualCancel}
      >
        {cancelLabel}
      </Button>
      <Button
        type={submitType}
        variant={submitVariant}
        onClick={submitType === 'button' ? onSubmit : undefined}
        disabled={isConfirmDisabled}
        aria-busy={isSubmitting}
        className={s.footer.dualSubmit}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : submitIcon}
        {submitLabel}
      </Button>
    </div>
  );
}
