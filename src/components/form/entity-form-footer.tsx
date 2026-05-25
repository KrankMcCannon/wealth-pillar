'use client';

import type { ReactNode } from 'react';
import { ModalFooterActions } from '@/components/ui/modal-footer-actions';

export interface EntityFormFooterProps {
  isEditMode: boolean;
  isSubmitting: boolean;
  isDeleting?: boolean;
  submitLabel: string;
  deleteLabel?: string;
  onDelete?: () => void;
  deleteTestId?: string;
  showSubmitSpinner?: boolean;
  showSubmitIcon?: boolean;
  secondaryAction?: ReactNode;
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
  showSubmitIcon = true,
  secondaryAction,
}: Readonly<EntityFormFooterProps>) {
  return (
    <ModalFooterActions
      variant="stacked-primary"
      submitLabel={submitLabel}
      isSubmitting={isSubmitting}
      disabled={isDeleting}
      showSubmitSpinner={showSubmitSpinner}
      showSubmitIcon={showSubmitIcon}
      secondaryAction={secondaryAction}
      {...(isEditMode && onDelete && deleteLabel ? { deleteLabel, onDelete, deleteTestId } : {})}
    />
  );
}
