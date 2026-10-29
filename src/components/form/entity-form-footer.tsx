'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ModalFooterActions } from '@/components/ui/modal-footer-actions';

export interface EntityFormFooterProps {
  isSubmitting: boolean;
  isDeleting?: boolean;
  submitLabel: string;
  cancelLabel?: string;
  onCancel: () => void;
  secondaryAction?: ReactNode;
}

export function EntityFormFooter({
  isSubmitting,
  isDeleting = false,
  submitLabel,
  cancelLabel,
  onCancel,
  secondaryAction,
}: Readonly<EntityFormFooterProps>) {
  const t = useTranslations('Common');

  return (
    <ModalFooterActions
      variant="dual"
      submitLabel={submitLabel}
      cancelLabel={cancelLabel ?? t('cancel')}
      onCancel={onCancel}
      submitType="submit"
      isSubmitting={isSubmitting}
      disabled={isDeleting}
      secondaryAction={secondaryAction}
    />
  );
}
