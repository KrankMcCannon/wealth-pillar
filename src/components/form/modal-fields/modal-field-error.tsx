'use client';

import { formModalStyles as s } from '@/components/form/form-modal-styles';

export interface ModalFieldErrorProps {
  message?: string;
}

export function ModalFieldError({ message }: Readonly<ModalFieldErrorProps>) {
  if (!message) return null;
  return <p className={s.fieldError}>{message}</p>;
}
