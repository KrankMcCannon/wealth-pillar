'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formModalStyles as s } from '@/components/form/form-modal-styles';
import { ModalFieldError } from './modal-field-error';

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
      <div className={cn('space-y-1', className)}>
        {children}
        {error ? <ModalFieldError message={error} /> : null}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('space-y-1', className)}>
        {label && htmlFor ? (
          <label htmlFor={htmlFor} className={s.noteLabel}>
            {label}
          </label>
        ) : null}
        {children}
        {hint ? <p className="px-1 text-xs text-modal-fg-muted">{hint}</p> : null}
        {error ? <ModalFieldError message={error} /> : null}
      </div>
    );
  }

  return (
    <div className={cn(s.noteShell, 'space-y-0', className)}>
      {label && htmlFor ? (
        <label htmlFor={htmlFor} className={s.noteLabel}>
          {label}
        </label>
      ) : label ? (
        <p className={s.noteLabel}>{label}</p>
      ) : null}
      {children}
      {hint ? <p className="mt-2 px-1 text-xs text-modal-fg-muted">{hint}</p> : null}
      {error ? <ModalFieldError message={error} /> : null}
    </div>
  );
}
