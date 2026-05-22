'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ModalWrapper, ModalBody, ModalFooter } from '@/components/ui/modal-wrapper';
import { Button } from '@/components/ui/button';
import { AlertTriangleIcon, Loader2Icon } from 'lucide-react';
import { radiusStyles, typographyStyles } from '@/features/budgets/theme/budget-styles';

const confirmationDialogStyles = {
  headerLayout: 'flex items-start gap-3',
  iconWrapper: `flex size-12 shrink-0 items-center justify-center ${radiusStyles.md} bg-destructive/10 border border-destructive/20 text-destructive`,
  icon: 'size-6',
  text: {
    message: `${typographyStyles.sm} text-modal-fg leading-relaxed`,
  },
  body: 'flex-1 space-y-2',
  buttons: {
    cancel:
      'w-full font-semibold border border-modal-border/30 text-modal-fg bg-modal-surface hover:bg-primary hover:text-primary-foreground',
    confirm: 'w-full font-semibold gap-2',
  },
  loadingIcon: 'size-4 animate-spin',
} as const;

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
