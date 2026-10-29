'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
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
  /** Full-width start-aligned value (invite email). Default is label-left / value-right. */
  layout?: 'split' | 'plain';
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
  layout = 'split',
}: Readonly<ModalTextFieldProps<T>>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });
  const fieldId = String(name);
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const isNumeric = type === 'number';
  const isPlain = layout === 'plain';
  const describedBy = [hint ? hintId : null, error?.message ? errorId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div>
      <div className={isPlain ? 'flex flex-col gap-1.5 px-3 py-2.5' : s.field.textShell}>
        {label ? (
          <label
            htmlFor={fieldId}
            className={
              isPlain
                ? 'mb-0 text-base font-medium leading-snug text-foreground'
                : s.field.textLabel
            }
          >
            {label}
          </label>
        ) : null}
        <input
          id={fieldId}
          type={isNumeric ? 'text' : type}
          inputMode={isNumeric ? 'decimal' : undefined}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={isPlain ? s.field.textInputPlain : s.field.textInput}
          {...field}
          value={field.value ?? ''}
        />
      </div>
      {hint ? (
        <p id={hintId} className="px-4 pb-2 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error?.message ? <ModalFieldError id={errorId} message={error.message} /> : null}
    </div>
  );
}
