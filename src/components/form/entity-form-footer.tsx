'use client';

import { Check, Loader2, Trash2 } from 'lucide-react';
import { formModalStyles as s } from './form-modal-styles';

export interface EntityFormFooterProps {
  isEditMode: boolean;
  isSubmitting: boolean;
  isDeleting?: boolean;
  submitLabel: string;
  deleteLabel?: string;
  onDelete?: () => void;
  deleteTestId?: string;
  showSubmitSpinner?: boolean;
}

export function EntityFormFooter({
  isEditMode,
  isSubmitting,
  isDeleting = false,
  submitLabel,
  deleteLabel,
  onDelete,
  deleteTestId,
  showSubmitSpinner = false,
}: Readonly<EntityFormFooterProps>) {
  const busy = isSubmitting || isDeleting;

  return (
    <div className={s.footerActionsStack}>
      <button type="submit" disabled={busy} className={s.primaryCta}>
        {showSubmitSpinner && isSubmitting ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
        ) : (
          <Check className="h-5 w-5 shrink-0" aria-hidden />
        )}
        {submitLabel}
      </button>
      {isEditMode && onDelete && deleteLabel ? (
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
