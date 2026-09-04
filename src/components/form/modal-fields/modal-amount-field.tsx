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

  const input = (
    <FormCurrencyInput
      value={field.value ?? ''}
      onChange={field.onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={variant === 'inline' ? s.field.textInput : s.amountInput}
      showSymbol={false}
      bare
      {...(variant === 'inline' ? { id: fieldId } : {})}
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
        {error?.message ? <ModalFieldError message={error.message} /> : null}
      </div>
    );
  }

  return (
    <ModalFormField
      variant="hero"
      {...(error?.message !== undefined ? { error: error.message } : {})}
    >
      <section className={s.amountSection} aria-labelledby={`${fieldId}-label`}>
        {resolvedLabel ? (
          <p id={`${fieldId}-label`} className={s.amountEyebrow}>
            {resolvedLabel}
          </p>
        ) : null}
        <div className={s.amountRow}>
          <span className={s.amountCurrency} aria-hidden>
            {currency}
          </span>
          {input}
        </div>
      </section>
    </ModalFormField>
  );
}
