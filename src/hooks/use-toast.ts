'use client';

import { toast as sonnerToast } from 'sonner';

type ToastVariant = 'default' | 'destructive' | 'success' | 'info';

export type ToastProps = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

function showToast({ title, description, variant = 'default' }: ToastProps) {
  const message = title ?? description ?? '';
  const options = title && description ? { description } : undefined;

  switch (variant) {
    case 'destructive':
      return sonnerToast.error(message, options);
    case 'success':
      return sonnerToast.success(message, options);
    case 'info':
      return sonnerToast.info(message, options);
    default:
      return sonnerToast(message, options);
  }
}

export function toast(props: ToastProps) {
  const id = showToast(props);

  return {
    id: String(id),
    dismiss: () => sonnerToast.dismiss(id),
    update: (next: Partial<ToastProps>) => {
      sonnerToast.dismiss(id);
      showToast({ ...props, ...next });
    },
  };
}

export function useToast() {
  return {
    toasts: [] as ToastProps[],
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        sonnerToast.dismiss(toastId);
        return;
      }
      sonnerToast.dismiss();
    },
  };
}
