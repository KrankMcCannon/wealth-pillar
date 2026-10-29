'use client';

import { formModalStyles as s } from '@/components/form/form-modal-styles';

export interface ModalFieldErrorProps {
  message?: string;
  id?: string;
}

export function ModalFieldError({ message, id }: Readonly<ModalFieldErrorProps>) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className={s.fieldError}>
      {message}
    </p>
  );
}
