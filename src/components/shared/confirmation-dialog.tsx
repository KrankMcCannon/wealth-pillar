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
      <DialogContent className="sm:max-w-[425px] border-primary/20" showCloseButton={!isLoading}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            {variant === 'destructive' && (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20">
                <AlertTriangleIcon className="size-6 text-destructive" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-lg font-bold text-black dark:text-white">
                {title}
              </DialogTitle>
              <p className="text-sm font-medium text-black/80 dark:text-white/80 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-6 gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto border-primary/20 hover:bg-primary/5 text-black dark:text-white font-semibold"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto font-semibold gap-2"
          >
            {isLoading && <Loader2Icon className="size-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
