'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { formModalStyles as s } from '@/components/form/form-modal-styles';
import { ModalFormField } from './modal-form-field';

export interface ModalTextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  type?: 'text' | 'email' | 'tel' | 'number';
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  hint?: string;
}

export function ModalTextField<T extends FieldValues>({
  control,
  name,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  disabled,
  hint,
}: Readonly<ModalTextFieldProps<T>>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });
  const fieldId = String(name);

  return (
    <ModalFormField
      {...(label !== undefined ? { label } : {})}
      htmlFor={fieldId}
      {...(error?.message !== undefined ? { error: error.message } : {})}
      {...(hint !== undefined ? { hint } : {})}
    >
      <input
        id={fieldId}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className={s.noteInput}
        {...field}
        value={field.value ?? ''}
      />
    </ModalFormField>
  );
}
