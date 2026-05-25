'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { formModalStyles as s } from '@/components/form/form-modal-styles';
import { ModalFieldError } from './modal-field-error';

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
    <div className="space-y-1">
      {hint ? <p className="px-1 text-xs text-modal-fg-muted">{hint}</p> : null}
      <div className={s.field.textShell}>
        {label ? (
          <label htmlFor={fieldId} className={s.field.textLabel}>
            {label}
          </label>
        ) : null}
        <Input
          id={fieldId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          className={s.field.textInput}
          {...field}
          value={field.value ?? ''}
        />
      </div>
      {error?.message ? <ModalFieldError message={error.message} /> : null}
    </div>
  );
}
