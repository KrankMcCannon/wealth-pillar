'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { FormCurrencyInput } from '@/components/form/form-currency-input';
import { formModalStyles as s } from '@/components/form/form-modal-styles';
import { ModalFormField } from './modal-form-field';
import { ModalFieldError } from './modal-field-error';

export interface ModalAmountFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  currency?: string;
  variant?: 'hero' | 'inline';
  disabled?: boolean;
  placeholder?: string;
  decimals?: number;
}

export function ModalAmountField<T extends FieldValues>({
  control,
  name,
  label,
  currency = '€',
  variant = 'hero',
  disabled,
  placeholder,
  decimals,
}: Readonly<ModalAmountFieldProps<T>>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });
  const resolvedLabel = label ?? '';
  const fieldId = String(name);
  const errorId = `${fieldId}-error`;

  const input = (
    <FormCurrencyInput
      id={fieldId}
      value={field.value ?? ''}
      onChange={field.onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={variant === 'inline' ? s.field.textInput : s.amountInput}
      showSymbol={false}
      bare
      autoComplete="off"
      aria-invalid={error ? true : undefined}
      aria-describedby={error?.message ? errorId : undefined}
      {...(decimals !== undefined ? { decimals } : {})}
    />
  );

  if (variant === 'inline') {
    return (
      <div>
        <div className={s.field.textShell}>
          {resolvedLabel ? (
            <label htmlFor={fieldId} className={s.field.textLabel}>
              {resolvedLabel}
            </label>
          ) : null}
          {input}
        </div>
        {error?.message ? <ModalFieldError id={errorId} message={error.message} /> : null}
      </div>
    );
  }

  return (
    <ModalFormField variant="hero">
      <section className={s.amountSection}>
        {resolvedLabel ? (
          <label htmlFor={fieldId} id={`${fieldId}-label`} className={s.amountEyebrow}>
            {resolvedLabel}
          </label>
        ) : null}
        <div className={s.amountRow}>
          <span className={s.amountCurrency} aria-hidden>
            {currency}
          </span>
          {input}
        </div>
      </section>
      {error?.message ? <ModalFieldError id={errorId} message={error.message} /> : null}
    </ModalFormField>
  );
}
