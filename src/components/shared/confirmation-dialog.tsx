'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ModalWrapper, ModalBody, ModalFooter } from '@/components/ui/modal-wrapper';
import { ModalFooterActions } from '@/components/ui/modal-footer-actions';
import { formModalStyles as s } from '@/components/form/form-modal-styles';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  title: string;
  message: string;
  description?: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  description,
  children,
  confirmText,
  cancelText,
  variant = 'default',
  isLoading = false,
}: Readonly<ConfirmationDialogProps>) {
  const t = useTranslations('Common');
  const resolvedConfirm = confirmText ?? t('confirm');
  const resolvedCancel = cancelText ?? t('cancel');

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={(open) => !open && onCancel()}
      title={title}
      {...(description !== undefined ? { description } : {})}
      showCloseButton={!isLoading}
      disableOutsideClose={isLoading}
    >
      <ModalBody>
        {children}
        {message ? <p className={s.footer.confirmMessage}>{message}</p> : null}
      </ModalBody>
      <ModalFooter>
        <ModalFooterActions
          variant="dual"
          cancelLabel={resolvedCancel}
          submitLabel={resolvedConfirm}
          onCancel={onCancel}
          onSubmit={handleConfirm}
          isSubmitting={isLoading}
          submitVariant={variant === 'destructive' ? 'destructive' : 'default'}
        />
      </ModalFooter>
    </ModalWrapper>
  );
}
