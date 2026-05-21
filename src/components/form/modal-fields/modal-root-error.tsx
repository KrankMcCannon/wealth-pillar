'use client';

import { formModalStyles as s } from '@/components/form/form-modal-styles';

export interface ModalRootErrorProps {
  message?: string;
}

export function ModalRootError({ message }: Readonly<ModalRootErrorProps>) {
  if (!message) return null;
  return (
    <div className={s.errorBanner} role="alert">
      {message}
    </div>
  );
}
