'use client';

import type { ReactNode } from 'react';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';

export interface ModalFormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  variant?: 'note' | 'hero' | 'inline';
  className?: string;
  children: ReactNode;
}

export function ModalFormField({
  label,
  htmlFor,
  error,
  hint,
  variant = 'note',
  className,
  children,
}: Readonly<ModalFormFieldProps>) {
  if (variant === 'hero') {
    return (
      <Field className={className} data-invalid={error ? true : undefined}>
        <FieldContent>{children}</FieldContent>
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
    );
  }

  return (
    <Field className={className} data-invalid={error ? true : undefined}>
      {label && htmlFor ? (
        <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      ) : label ? (
        <FieldLabel>{label}</FieldLabel>
      ) : null}
      <FieldContent>{children}</FieldContent>
      {hint ? <FieldDescription>{hint}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
