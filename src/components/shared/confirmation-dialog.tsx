'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ModalWrapper, ModalBody, ModalFooter } from '@/components/ui/modal-wrapper';
import { Button } from '@/components/ui/button';
import { AlertTriangleIcon, Loader2Icon } from 'lucide-react';
import { confirmationDialogStyles } from './theme/feedback-styles';

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
        <div className={confirmationDialogStyles.headerLayout}>
          {variant === 'destructive' && (
            <div className={confirmationDialogStyles.iconWrapper}>
              <AlertTriangleIcon className={confirmationDialogStyles.icon} />
            </div>
          )}
          <div className={confirmationDialogStyles.body}>
            {children}
            {message ? <p className={confirmationDialogStyles.text.message}>{message}</p> : null}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className={confirmationDialogStyles.buttons.cancel}
        >
          {resolvedCancel}
        </Button>
        <Button
          variant={variant}
          onClick={handleConfirm}
          disabled={isLoading}
          className={confirmationDialogStyles.buttons.confirm}
        >
          {isLoading && <Loader2Icon className={confirmationDialogStyles.loadingIcon} />}
          {resolvedConfirm}
        </Button>
      </ModalFooter>
    </ModalWrapper>
  );
}
