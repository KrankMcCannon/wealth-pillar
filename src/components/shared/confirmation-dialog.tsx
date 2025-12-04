'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangleIcon, Loader2Icon } from 'lucide-react';
import { confirmationDialogStyles } from './theme/feedback-styles';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  title: string;
  message: string;
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
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  variant = 'default',
  isLoading = false,
}: ConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className={confirmationDialogStyles.content} showCloseButton={!isLoading}>
        <DialogHeader className={confirmationDialogStyles.header}>
          <div className={confirmationDialogStyles.headerLayout}>
            {variant === 'destructive' && (
              <div className={confirmationDialogStyles.iconWrapper}>
                <AlertTriangleIcon className={confirmationDialogStyles.icon} />
              </div>
            )}
            <div className={confirmationDialogStyles.body}>
              <DialogTitle className={confirmationDialogStyles.text.title}>{title}</DialogTitle>
              <p className={confirmationDialogStyles.text.message}>{message}</p>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className={confirmationDialogStyles.footer}>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className={confirmationDialogStyles.buttons.cancel}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={isLoading}
            className={confirmationDialogStyles.buttons.confirm}
          >
            {isLoading && <Loader2Icon className={confirmationDialogStyles.loadingIcon} />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
